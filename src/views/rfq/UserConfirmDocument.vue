<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_API_URL}`;

const isLoading = ref(false);
const isSaving = ref(false);
const isConfirming = ref(false);
const doc = ref(null);
const activeItemIndex = ref(0);
const showConfirmPopup = ref(false);

const allSteps = [
  { id: "user_pending", label: "User \nPending" },
  { id: "purchase_accept", label: "Purchase\nAccept" },
  { id: "waiting_quotation", label: "Waiting\nQuotation" },
  { id: "purchase_compare", label: "Purchase\nCompare" },
  { id: "user_confirm", label: "User\nConfirm" },
  { id: "cost_saving", label: "Cost\nSaving" },
  { id: "purchase_confirm", label: "Purchase\nConfirm" },
  { id: "finish", label: "Finish" },
];

function stepStatus(stepId) {
  if (!doc.value) return "pending";
  const order = allSteps.map((s) => s.id);
  const rawStatus = (doc.value.status ?? doc.value.Status ?? "")
    .toString()
    .trim()
    .toLowerCase();
  const cur = order.indexOf(rawStatus);
  const idx = order.indexOf(stepId);
  if (cur === -1) return "pending";
  if (idx < cur) return "done";
  if (idx === cur) return "active";
  return "pending";
}

// These are READ-ONLY here — this data was already filled/locked by
// Purchase during the purchase_compare step. The user only reviews it.
const DETAIL_FIELDS = [
  { key: "itemDescription", label: "Item description" },
  { key: "specPartNo", label: "Specification / Part no." },
  { key: "model", label: "Model" },
];

// ---  Helper -------------------------------------------------
function isSafeFileUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    if (url.startsWith("/")) return true;
    const u = new URL(url, window.location.origin);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

async function fetchDetail() {
  if (!drawer.docRequestId) return;
  isLoading.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Normalize items/vendorQuotes defensively
    data.items = (data.items ?? []).map((it) => ({
      ...it,
      vendorQuotes: (it.vendorQuotes ?? []).map((v) => ({
        id: v.id ?? null,
        vendorName: v.vendorName ?? "",
        itemDescription: v.itemDescription ?? "",
        specPartNo: v.specPartNo ?? "",
        model: v.model ?? "",
        remark: v.remark ?? "",
        price: v.price ?? null,
        quotationFilePath: v.quotationFilePath ?? null,
        isRecommended: !!v.isRecommended, // set by Purchase, read-only here
        isChosen: !!v.isChosen, 
        differReason: v.differReason ?? "",
      })),
    }));

    doc.value = data;
    activeItemIndex.value = 0;
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "โหลดข้อมูลไม่สำเร็จ",
      detail: err.message,
      life: 4000,
    });
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [drawer.docRequestId, drawer.showDrawer, drawer.drawerRole],
  async ([id, show, role]) => {
    await nextTick();
    if (id && show && role === "user_confirm") {
      doc.value = null;
      await fetchDetail();
    }
  },
  { immediate: true },
);

const currentItem = computed(
  () => doc.value?.items?.[activeItemIndex.value] ?? null,
);

const recommendedVendorOf = (item) =>
  item?.vendorQuotes?.find((vq) => vq.isRecommended) ?? null;

const chosenVendorOf = (item) =>
  item?.vendorQuotes?.find((vq) => vq.isChosen) ?? null;


// recommendation — this is what forces a mandatory remark + confirm popup.
function choiceDiffers(item) {
  const rec = recommendedVendorOf(item);
  const chosen = chosenVendorOf(item);
  if (!rec || !chosen) return false;
  return rec.id !== chosen.id || rec !== chosen;
}

function prevItem() {
  if (activeItemIndex.value > 0) activeItemIndex.value--;
}
function nextItem() {
  if (doc.value && activeItemIndex.value < doc.value.items.length - 1)
    activeItemIndex.value++;
}

function chooseVendor(vqIndex) {
  if (!currentItem.value) return;
  currentItem.value.vendorQuotes.forEach((vq, i) => {
    vq.isChosen = i === vqIndex;
    // Clear a stale differ-reason from a previous, different selection.
    if (!vq.isChosen) vq.differReason = "";
  });
}

// Persist just the current item's choice (does not advance workflow state).
async function saveCurrentItem() {
  if (!currentItem.value) return;
  const chosen = chosenVendorOf(currentItem.value);
  if (!chosen) {
    toast.add({
      severity: "warn",
      summary: "กรุณาเลือก Vendor",
      detail: "กรุณากด Choose เพื่อเลือก Vendor สำหรับ Item นี้",
      life: 3500,
    });
    return;
  }
  if (choiceDiffers(currentItem.value) && !chosen.differReason?.trim()) {
    toast.add({
      severity: "warn",
      summary: "กรุณาระบุเหตุผล",
      detail:
        "ตัวเลือกของคุณไม่ตรงกับ Vendor ที่จัดซื้อแนะนำ กรุณากรอกเหตุผลในช่อง Reasons choices differ",
      life: 4500,
    });
    return;
  }

  isSaving.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/items/${currentItem.value.id}/user-choice`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chosenVendorQuoteId: chosen.id,
          differReason: choiceDiffers(currentItem.value)
            ? chosen.differReason?.trim()
            : "",
        }),
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    toast.add({
      severity: "success",
      summary: "บันทึกแล้ว",
      detail: `Item ${activeItemIndex.value + 1} บันทึกตัวเลือกสำเร็จ`,
      life: 2500,
    });
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "บันทึกไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
  } finally {
    isSaving.value = false;
  }
}

// Validate ALL items before allowing the final Confirm popup to open.
function requestConfirm() {
  if (!doc.value?.items?.length) return;

  const missingChoice = [];
  const missingReason = [];

  doc.value.items.forEach((it, idx) => {
    const chosen = chosenVendorOf(it);
    if (!chosen) {
      missingChoice.push(idx);
      return;
    }
    if (choiceDiffers(it) && !chosen.differReason?.trim()) {
      missingReason.push(idx);
    }
  });

  if (missingChoice.length) {
    activeItemIndex.value = missingChoice[0];
    toast.add({
      severity: "warn",
      summary: "ยังเลือกไม่ครบ",
      detail: `กรุณาเลือก Vendor ให้ครบทุก Item (ขาด ${missingChoice.length} Item)`,
      life: 4000,
    });
    return;
  }

  if (missingReason.length) {
    activeItemIndex.value = missingReason[0];
    toast.add({
      severity: "warn",
      summary: "ต้องระบุเหตุผล",
      detail:
        "มี Item ที่คุณเลือก Vendor ไม่ตรงกับที่จัดซื้อแนะนำ กรุณากรอกเหตุผลก่อนยืนยัน",
      life: 4500,
    });
    return;
  }

  // All good — require an explicit confirmation step before hitting the API.
  showConfirmPopup.value = true;
}

function closeDrawer() {
  // Guard against accidentally closing mid-submit and losing the
  // in-flight confirm state / double-triggering the API.
  if (isConfirming.value) return;
  drawer.showDrawer = false;
}

async function confirmFinal() {
  if (!doc.value?.items?.length) return;
  isConfirming.value = true;
  try {
    const payload = {
      items: doc.value.items.map((it) => {
        const chosen = chosenVendorOf(it);
        return {
          itemId: it.id,
          chosenVendorQuoteId: chosen?.id ?? null,
          differReason: choiceDiffers(it) ? chosen?.differReason?.trim() ?? "" : "",
        };
      }),
    };

    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/user-confirm`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }

    toast.add({
      severity: "success",
      summary: "ยืนยันสำเร็จ",
      detail: "ส่งต่อไปยังขั้นตอน Cost Saving แล้ว",
      life: 4000,
    });
    showConfirmPopup.value = false;
    await fetchDetail();
    isConfirming.value = false;
    closeDrawer();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "ยืนยันไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
  } finally {
    isConfirming.value = false;
  }
}


</script>

<template>
  <Teleport to="body">
    <Transition name="uc-fade">
      <div
        v-if="drawer.showDrawer && drawer.drawerRole === 'user_confirm'"
        class="uc-overlay"
        @click.self="closeDrawer"
      >
        <Transition name="uc-slide" appear>
          <div class="uc-panel" role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="uc-header">
              <div class="uc-header-left">
                <div class="uc-badge">RFQ</div>
                <div>
                  <h2 class="uc-title">User Confirm</h2>
                  <span class="uc-sub">
                    {{ doc?.rfqNo }} · {{ doc?.revNo }} ·
                    {{ doc?.items?.length ?? 0 }} Items
                  </span>
                </div>
              </div>
              <button class="uc-close" @click="closeDrawer">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Pipeline -->
            <div class="uc-pipeline">
              <div class="uc-pipeline-track">
                <template v-for="(step, i) in allSteps" :key="step.id">
                  <div class="uc-step" :class="`uc-step--${stepStatus(step.id)}`">
                    <div class="uc-node">
                      <svg
                        v-if="stepStatus(step.id) === 'done'"
                        width="12"
                        height="12"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                      </svg>
                      <span v-else-if="stepStatus(step.id) === 'active'" class="uc-pulse" />
                      <span v-else class="uc-num">{{ i + 1 }}</span>
                    </div>
                    <span class="uc-step-label">{{ step.label }}</span>
                  </div>
                  <div
                    v-if="i < allSteps.length - 1"
                    class="uc-arrow"
                    :class="{ 'uc-arrow--done': stepStatus(step.id) === 'done' }"
                  >
                    <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
                      <path
                        d="M1 6H14M10 1l5 5-5 5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                </template>
              </div>
            </div>

            <div class="uc-body">
              <div v-if="isLoading" class="uc-loading">
                <i class="pi pi-spin pi-spinner"></i> กำลังโหลด...
              </div>

              <template v-else-if="doc && currentItem">
                <!-- Document meta -->
                <div class="uc-meta-grid">
                  <div class="uc-meta-cell">
                    <span>RFQ No.</span><strong>{{ doc.rfqNo }}</strong>
                  </div>
                  <div class="uc-meta-cell">
                    <span>Req Date</span><strong>{{ doc.createdAt }}</strong>
                  </div>
                  <div class="uc-meta-cell">
                    <span>Target PUR Reply</span
                    ><strong>{{ currentItem.targetPURreply ?? "-" }}</strong>
                  </div>
                  <div class="uc-meta-cell">
                    <span>Actual Date PUR Replied</span
                    ><strong>{{ doc.actualPurReplyDate ?? "-" }}</strong>
                  </div>
                  <div class="uc-meta-cell">
                    <span>Project Name</span
                    ><strong>{{ currentItem.projectName || "-" }}</strong>
                  </div>
                  <div class="uc-meta-cell">
                    <span>GL Code</span
                    ><strong>{{ currentItem.glCode || "-" }}</strong>
                  </div>
                  <div class="uc-meta-cell">
                    <span>SAP Item No.</span
                    ><strong>{{ currentItem.sapItem || "-" }}</strong>
                  </div>
                  <div class="uc-meta-cell">
                    <span>User / Engineer / Sale</span
                    ><strong>{{ doc.requesterEmail }}</strong>
                  </div>
                </div>

                <!-- Compare table (read-only vendor data + user Choose) -->
                <div class="uc-table-wrap">
                  <table class="uc-table">
                    <thead>
                      <tr>
                        <th class="uc-th-detail">Detail</th>
                        <th
                          v-for="(vq, vi) in currentItem.vendorQuotes"
                          :key="vi"
                          class="uc-th-vendor"
                          :class="{ 'uc-th-vendor--reco': vq.isRecommended }"
                        >
                          Vendor {{ vi + 1 }}
                          <span v-if="vq.isRecommended" class="uc-reco-tag">

                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <!-- Read-only detail rows: filled/locked at purchase_compare -->
                      <tr v-for="f in DETAIL_FIELDS" :key="f.key">
                        <td class="uc-td-label">{{ f.label }}</td>
                        <td v-for="(vq, vi) in currentItem.vendorQuotes" :key="vi">
                          <span class="uc-static">{{ vq[f.key] || "-" }}</span>
                        </td>
                      </tr>

                      <!-- Remark Reasons From PUR (read-only) -->
                      <tr>
                        <td class="uc-td-label uc-td-label--warn">
                          Remark Reasons From PUR
                        </td>
                        <td v-for="(vq, vi) in currentItem.vendorQuotes" :key="vi">
                          <span class="uc-static">{{ vq.remark || "-" }}</span>
                        </td>
                      </tr>

                      <!-- Price (read-only) -->
                      <tr>
                        <td class="uc-td-label">Price</td>
                        <td v-for="(vq, vi) in currentItem.vendorQuotes" :key="vi">
                          <span class="uc-static">{{ vq.price ?? "-" }}</span>
                        </td>
                      </tr>

                      <!-- Quotation Files (read-only, safe-link only) -->
                      <tr>
                        <td class="uc-td-label">Quotation Files</td>
                        <td v-for="(vq, vi) in currentItem.vendorQuotes" :key="vi">
                          <a
                            v-if="isSafeFileUrl(vq.quotationFilePath)"
                            :href="vq.quotationFilePath"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="uc-file-link"
                          >
                            <i class="pi pi-file-pdf"></i> ดูไฟล์
                          </a>
                          <span v-else class="uc-static">-</span>
                        </td>
                      </tr>

                      <!-- Purchase Recommended (read-only badge) -->
                      <tr>
                        <td class="uc-td-label">Purchase Recommended</td>
                        <td v-for="(vq, vi) in currentItem.vendorQuotes" :key="vi">
                          <div
                            v-if="vq.isRecommended"
                            class="uc-badge-pill uc-badge-pill--reco"
                          >
                            <i class="pi pi-check-circle"></i> Recommended
                          </div>
                          <span v-else class="uc-static">-</span>
                        </td>
                      </tr>

                      <!-- Reasons choices differ — editable ONLY on the chosen
                           vendor, and ONLY meaningful/required when it differs
                           from Purchasing's recommendation. -->
                      <tr class="uc-row-editable uc-row-differ">
                        <td class="uc-td-label uc-td-label--warn">
                          Reasons choices differ.
                        </td>
                        <td v-for="(vq, vi) in currentItem.vendorQuotes" :key="vi">
                          <input
                            v-if="vq.isChosen"
                            v-model="vq.differReason"
                            type="text"
                            maxlength="500"
                            class="uc-input"
                            :class="{
                              'uc-input--required':
                                choiceDiffers(currentItem) && !vq.differReason?.trim(),
                            }"
                            :placeholder="
                              choiceDiffers(currentItem)
                                ? 'จำเป็นต้องระบุเหตุผล (บังคับกรอก)'
                                : 'Insert text'
                            "
                          />
                          <span v-else class="uc-static">-</span>
                        </td>
                      </tr>

                      <!-- Choose (user's own pick, single-select) -->
                      <tr class="uc-row-editable uc-row-choose">
                        <td class="uc-td-label">Choose</td>
                        <td v-for="(vq, vi) in currentItem.vendorQuotes" :key="vi">
                          <button
                            class="uc-choose-btn"
                            :class="{ 'uc-choose-btn--active': vq.isChosen }"
                            @click="chooseVendor(vi)"
                          >
                            <i
                              class="pi"
                              :class="vq.isChosen ? 'pi-check-circle' : 'pi-circle'"
                            ></i>
                            Choose
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p v-if="choiceDiffers(currentItem)" class="uc-differ-hint">
                  <i class="pi pi-exclamation-triangle"></i>
                  ตัวเลือกของคุณไม่ตรงกับ Vendor ที่จัดซื้อแนะนำ — ต้องกรอกเหตุผลในช่อง
                  "Reasons choices differ" ก่อนจึงจะยืนยันได้
                </p>

                <!-- Item navigator -->
                <div class="uc-item-nav">
                  <button
                    class="uc-nav-btn"
                    :disabled="activeItemIndex === 0"
                    @click="prevItem"
                  >
                    <i class="pi pi-chevron-left"></i>
                  </button>
                  <span class="uc-nav-label"
                    >Item {{ activeItemIndex + 1 }} / {{ doc.items.length }}</span
                  >
                  <button
                    class="uc-nav-btn"
                    :disabled="activeItemIndex === doc.items.length - 1"
                    @click="nextItem"
                  >
                    <i class="pi pi-chevron-right"></i>
                  </button>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="uc-footer">
              <span class="uc-role-badge">👤 User Confirm</span>
              <div class="uc-footer-actions">
                <button class="uc-btn uc-btn--ghost" @click="closeDrawer">
                  Cancel
                </button>
                <button
                  class="uc-btn uc-btn--secondary"
                  :disabled="isSaving"
                  @click="saveCurrentItem"
                >
                  <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
                  {{ isSaving ? "กำลังบันทึก..." : "Save Choice" }}
                </button>
                <button class="uc-btn uc-btn--primary" @click="requestConfirm">
                  <i class="pi pi-flag"></i> Confirm
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Final Confirm Popup — required whenever the workflow reaches Confirm,
       and is the last line of defense forcing an explicit human decision
       before the API call that advances the document's state. -->
  <Teleport to="body">
    <Transition name="uc-confirm-fade">
      <div v-if="showConfirmPopup" class="uc-confirm-overlay">
        <div class="uc-confirm-box" role="alertdialog" aria-modal="true">
          <p class="uc-confirm-msg">
            ยืนยันตัวเลือก Vendor ของคุณสำหรับทุก Item ใช่หรือไม่?
            หลังจากนี้จะส่งต่อไปยังขั้นตอน Cost Saving และจะไม่สามารถแก้ไขได้อีก
          </p>
          <div class="uc-confirm-actions">
            <button
              class="uc-btn uc-btn--ghost"
              :disabled="isConfirming"
              @click="showConfirmPopup = false"
            >
              Cancel
            </button>
            <button
              class="uc-btn uc-btn--primary"
              :disabled="isConfirming"
              @click="confirmFinal"
            >
              {{ isConfirming ? "กำลังส่ง..." : "Confirm" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");

.uc-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
}
.uc-fade-enter-active { transition: opacity 0.25s ease; }
.uc-fade-leave-active { transition: opacity 0.28s ease; }
.uc-fade-enter-from, .uc-fade-leave-to { opacity: 0; }
.uc-slide-enter-active { animation: ucSlideIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both; }
.uc-slide-leave-active { animation: ucSlideOut 0.28s cubic-bezier(0.4, 0, 1, 1) both; }
@keyframes ucSlideIn {
  from { transform: translateX(100%); opacity: 0.6; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes ucSlideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

.uc-panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--bg-base) 84%, var(--orb-1) 16%);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -24px 0 80px rgba(0, 0, 0, 0.45);
  font-family: "DM Sans", sans-serif;
  overflow: hidden;
}

.uc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0; background: var(--bg-surface);
}
.uc-header-left { display: flex; align-items: center; gap: 12px; }
.uc-badge {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--accent-dim); border: 1px solid var(--accent-glow);
  color: var(--accent); display: flex; align-items: center; justify-content: center;
  font-family: "Sora", sans-serif; font-size: 11px; font-weight: 700;
}
.uc-title { font-family: "Sora", sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px; }
.uc-sub { font-size: 11.5px; color: var(--text-muted); }
.uc-close {
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.uc-close:hover { background: var(--resent-bg); color: var(--resent); border-color: var(--resent-border); }

.uc-pipeline { padding: 14px 24px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; background: var(--bg-surface); overflow-x: auto; }
.uc-pipeline-track { display: flex; align-items: center; min-width: max-content; }
.uc-step { display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 76px; }
.uc-node { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.uc-step-label { font-size: 9.5px; font-weight: 500; text-align: center; line-height: 1.3; white-space: pre-line; }
.uc-num { font-size: 11px; font-weight: 700; }
.uc-step--done .uc-node { background: var(--accept-bg); border: 1.5px solid var(--accept-border); color: var(--accept); }
.uc-step--done .uc-step-label { color: var(--accept); }
.uc-step--active .uc-node { background: var(--accent-dim); border: 2px solid var(--accent); color: var(--accent); box-shadow: 0 0 0 4px var(--accent-dim); }
.uc-step--active .uc-step-label { color: var(--accent); font-weight: 700; }
.uc-step--pending .uc-node { background: var(--bg-elevated); border: 1.5px solid var(--border-subtle); color: var(--text-muted); }
.uc-step--pending .uc-step-label { color: var(--text-muted); }
.uc-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: ucPulse 1.6s ease-in-out infinite; }
@keyframes ucPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.7; }
}
.uc-arrow { flex: 1; display: flex; align-items: flex-start; padding-top: 6px; color: var(--border-subtle); min-width: 18px; justify-content: center; }
.uc-arrow--done { color: var(--accept-border); }

.uc-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px; }
.uc-loading { display: flex; align-items: center; gap: 10px; justify-content: center; padding: 60px 0; color: var(--text-muted); }

.uc-meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
.uc-meta-cell { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 12px; display: flex; flex-direction: column; gap: 3px; }
.uc-meta-cell span { font-size: 9.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.uc-meta-cell strong { font-size: 12.5px; color: var(--text-primary); font-weight: 500; }

.uc-table-wrap { overflow-x: auto; border: 1px solid var(--border-subtle); border-radius: 12px; margin-bottom: 12px; }
.uc-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.uc-table th, .uc-table td { padding: 8px 12px; border: 1px solid var(--border-subtle); text-align: left; vertical-align: middle; }
.uc-table tr > *:first-child { border-left: none; }
.uc-table tr > *:last-child { border-right: none; }
.uc-table thead tr > * { border-top: none; }
.uc-table tbody tr:last-child > * { border-bottom: none; }
.uc-th-detail { background: var(--bg-elevated); font-weight: 700; color: var(--text-secondary); width: 180px; }
.uc-th-vendor { background: var(--accent-dim); color: var(--accent); font-weight: 700; text-align: center; min-width: 180px; }
.uc-th-vendor--reco { background: var(--accept-bg); color: var(--accept); }
.uc-reco-tag { display: block; font-size: 9.5px; font-weight: 600; margin-top: 2px; }
.uc-td-label { background: var(--bg-elevated); font-weight: 600; color: var(--text-secondary); }
.uc-td-label--warn { color: var(--resent, #ef4444); }
.uc-static { color: var(--text-primary); }
.uc-row-editable td:not(.uc-td-label) { background: color-mix(in srgb, var(--accent-dim) 40%, transparent); }
.uc-input {
  width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-subtle);
  border-radius: 6px; color: var(--text-primary); padding: 6px 8px; font-size: 12.5px; box-sizing: border-box;
}
.uc-input:focus { outline: none; border-color: var(--accent); }
.uc-input--required { border-color: var(--resent, #ef4444); box-shadow: 0 0 0 2px color-mix(in srgb, var(--resent, #ef4444) 25%, transparent); }
.uc-file-link { color: var(--accent); font-size: 11.5px; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px; }

.uc-badge-pill {
  display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700;
}
.uc-badge-pill--reco { background: var(--accept-bg); border: 1px solid var(--accept-border); color: var(--accept); }

.uc-choose-btn {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer; width: 100%; justify-content: center;
}
.uc-choose-btn--active { background: var(--accent-dim); border-color: var(--accent-glow); color: var(--accent); }

.uc-differ-hint {
  display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600;
  color: var(--resent, #ef4444); background: color-mix(in srgb, var(--resent, #ef4444) 12%, transparent);
  border: 1px dashed var(--resent, #ef4444); border-radius: 8px; padding: 8px 12px; margin-bottom: 14px;
}

.uc-item-nav { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 10px 0; }
.uc-nav-btn { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-secondary); cursor: pointer; }
.uc-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.uc-nav-label { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }

.uc-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid var(--border-subtle); flex-shrink: 0; background: var(--bg-surface); }
.uc-role-badge { font-size: 11.5px; font-weight: 600; background: var(--accent-dim); border: 1px solid var(--accent-glow); color: var(--accent); padding: 3px 10px; border-radius: 6px; }
.uc-footer-actions { display: flex; gap: 8px; }
.uc-btn { padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: "DM Sans", sans-serif; display: flex; align-items: center; gap: 6px; }
.uc-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.uc-btn--ghost { background: transparent; border: 1px solid var(--border-subtle); color: var(--text-secondary); }
.uc-btn--ghost:hover { background: var(--bg-elevated); }
.uc-btn--secondary { background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-secondary); }
.uc-btn--secondary:not(:disabled):hover { background: var(--accent-dim); border-color: var(--accent-glow); color: var(--accent); }
.uc-btn--primary {
  font-family: "Sora", sans-serif; font-weight: 700; border: none; color: var(--text-primary-help);
  background: linear-gradient(135deg, var(--orb-1), var(--accent)); box-shadow: 0 4px 14px var(--accent-glow);
}
.uc-btn--primary:not(:disabled):hover { transform: translateY(-1px); }

.uc-confirm-fade-enter-active { transition: opacity 0.18s ease; }
.uc-confirm-fade-leave-active { transition: opacity 0.16s ease; }
.uc-confirm-fade-enter-from, .uc-confirm-fade-leave-to { opacity: 0; }
.uc-confirm-overlay {
  position: fixed; inset: 0; z-index: 1100; background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.uc-confirm-box {
  width: 100%; max-width: 400px; background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: 14px; padding: 22px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.uc-confirm-msg { font-size: 13.5px; color: var(--text-primary); line-height: 1.5; margin: 0 0 18px; text-align: center; }
.uc-confirm-actions { display: flex; justify-content: center; gap: 10px; }
</style>