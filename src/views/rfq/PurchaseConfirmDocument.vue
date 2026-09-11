<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_API_URL}`;

const isLoading = ref(false);
const isApproving = ref(false);
const isBacking = ref(false);
const doc = ref(null);
const activeItemIndex = ref(0);
const showApproveConfirm = ref(false);

// ── Pipeline
const allSteps = [
  { id: "user_pending", label: "User\nPending" },
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
  const raw = (doc.value.status ?? doc.value.Status ?? "")
    .toString()
    .trim()
    .toLowerCase();

  if (raw === "cancel" || raw === "cancelled" || raw === "canceled") {
    return "cancelled";
  }

  const effectiveStatus = raw === "reject" ? "user_pending" : raw;
  const cur = order.indexOf(effectiveStatus);
  const idx = order.indexOf(stepId);

  if (cur === -1) return "pending";
  const activeIdx = raw === "user_pending" ? cur + 1 : cur;

  if (idx < cur) return "done";
  if (idx === cur) {
    if (raw === "reject") return "rejected";
    if (raw === "user_pending") return "done";
  }
  if (idx === activeIdx && raw === "user_pending") return "active";
  if (idx === cur && raw !== "user_pending" && raw !== "reject") return "active";

  return "pending";
}

// ── โหลดข้อมูล RFQ ──
async function fetchDetail() {
  if (!drawer.docRequestId) return;
  isLoading.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    doc.value = await res.json();
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
    if (id && show && role === "purchase_confirm") {
      doc.value = null;
      await fetchDetail();
    }
  },
  { immediate: true },
);

const currentItem = computed(
  () => doc.value?.items?.[activeItemIndex.value] ?? null,
);

// ── Vendor quotes  ──
const currentVendorQuotes = computed(
  () => currentItem.value?.vendorQuotes ?? [],
);

function prevItem() {
  if (activeItemIndex.value > 0) activeItemIndex.value--;
}
function nextItem() {
  if (doc.value && activeItemIndex.value < doc.value.items.length - 1)
    activeItemIndex.value++;
}

// ── Back Compare: ย้อนกลับไป Purchase Compare ──
async function backToCompare() {
  isBacking.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/cost-saving/back-compare`,
      { method: "POST" },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    toast.add({
      severity: "success",
      summary: "ย้อนกลับแล้ว",
      detail: "ส่งกลับไป Purchase Compare แล้ว",
      life: 3500,
    });
    await fetchDetail();
    closeDrawer();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "ย้อนกลับไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
  } finally {
    isBacking.value = false;
  }
}

// ── Approve: อนุมัติ จบ RFQ ──
function requestApprove() {
  if (!doc.value?.items?.length) return;
  showApproveConfirm.value = true;
}

async function confirmApprove() {
  isApproving.value = true;
  try {
    const itemId = currentItem.value?.id;
    if (!itemId) throw new Error("ไม่พบ Item ที่จะอนุมัติ");

    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/items/${itemId}/purchase-confirm/approve`,
      { method: "POST" },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    toast.add({
      severity: "success",
      summary: "อนุมัติสำเร็จ",
      detail: "RFQ เสร็จสิ้นแล้ว",
      life: 4000,
    });
    showApproveConfirm.value = false;
    await fetchDetail();
    closeDrawer();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "อนุมัติไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
  } finally {
    isApproving.value = false;
  }
}

function closeDrawer() {
  drawer.showDrawer = false;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pfc-fade">
      <div
        v-if="drawer.showDrawer && drawer.drawerRole === 'purchase_confirm'"
        class="pfc-overlay"
        @click.self="closeDrawer"
      >
        <Transition name="pfc-slide" appear>
          <div class="pfc-panel" role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="pfc-header">
              <div class="pfc-header-left">
                <div class="pfc-badge">RFQ</div>
                <div>
                  <h2 class="pfc-title">Purchase Confirm</h2>
                  <span class="pfc-sub">
                    {{ doc?.rfqNo }} · {{ doc?.revNo }} ·
                    {{ doc?.items?.length ?? 0 }} Items
                  </span>
                </div>
              </div>
              <button class="pfc-close" @click="closeDrawer">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Pipeline -->
            <div class="pfc-pipeline">
              <div class="pfc-pipeline-track">
                <template v-for="(step, i) in allSteps" :key="step.id">
                  <div
                    class="pfc-step"
                    :class="`pfc-step--${stepStatus(step.id)}`"
                  >
                    <div class="pfc-node">
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
                      <span
                        v-else-if="stepStatus(step.id) === 'active'"
                        class="pfc-pulse"
                      />
                      <span
                        v-else-if="stepStatus(step.id) === 'rejected'"
                        class="pfc-x"
                        >✕</span
                      >
                      <span v-else class="pfc-num">{{ i + 1 }}</span>
                    </div>
                    <span class="pfc-step-label">{{ step.label }}</span>
                  </div>
                  <div
                    v-if="i < allSteps.length - 1"
                    class="pfc-arrow"
                    :class="{
                      'pfc-arrow--done': stepStatus(step.id) === 'done',
                    }"
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

            <div class="pfc-body">
              <div v-if="isLoading" class="pfc-loading">
                <i class="pi pi-spin pi-spinner"></i> กำลังโหลด...
              </div>

              <template v-else-if="doc && currentItem">
                <!-- Document meta (การ์ดเล็กแยกแต่ละช่อง เหมือน User Confirm) -->
                <div class="pfc-meta-grid">
                  <div class="pfc-meta-cell">
                    <span>RFQ No.</span><strong>{{ doc.rfqNo }}</strong>
                  </div>
                  <div class="pfc-meta-cell">
                    <span>Req Date</span><strong>{{ doc.createdAt }}</strong>
                  </div>
                  <div class="pfc-meta-cell">
                    <span>Target PUR Reply</span
                    ><strong>{{ currentItem.targetPURreply ?? "-" }}</strong>
                  </div>
                  <div class="pfc-meta-cell">
                    <span>Actual Date PUR Replied</span
                    ><strong>{{ doc.actualPurReplyDate ?? "-" }}</strong>
                  </div>
                  <div class="pfc-meta-cell">
                    <span>Project Name</span
                    ><strong>{{ currentItem.projectName || "-" }}</strong>
                  </div>
                  <div class="pfc-meta-cell">
                    <span>GL Code</span
                    ><strong>{{ currentItem.glCode || "-" }}</strong>
                  </div>
                  <div class="pfc-meta-cell">
                    <span>SAP Item No.</span
                    ><strong>{{ currentItem.sapItem || "-" }}</strong>
                  </div>
                  <div class="pfc-meta-cell">
                    <span>User / Engineer / Sale</span
                    ><strong>{{ doc.requesterEmail }}</strong>
                  </div>
                </div>

                <!-- ตารางเทียบ Vendor 1/2/3 -->
                <div v-if="currentVendorQuotes.length" class="pfc-table-wrap">
                  <table class="pfc-table">
                    <thead>
                      <tr>
                        <th class="pfc-th-detail">Detail</th>
                        <th
                          v-for="(vq, vi) in currentVendorQuotes"
                          :key="vi"
                          class="pfc-th-vendor"
                          :class="{ 'pfc-th-vendor--reco': vq.isRecommended }"
                        >
                          Vendor {{ vi + 1 }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="pfc-section-row">
                        <td :colspan="currentVendorQuotes.length + 1">
                          Item Details
                        </td>
                      </tr>
                      <tr>
                        <td class="pfc-td-label">Item description</td>
                        <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                          <span class="pfc-static">{{ vq.itemDescription || "-" }}</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="pfc-td-label">
                          Specification / Part no.
                        </td>
                        <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                          <span class="pfc-static">{{ vq.specPartNo || "-" }}</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="pfc-td-label">Model</td>
                        <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                          <span class="pfc-static">{{ vq.model || "-" }}</span>
                        </td>
                      </tr>

                      <tr class="pfc-section-row pfc-section-row--final">
                        <td :colspan="currentVendorQuotes.length + 1">
                          Final Review
                          <span class="pfc-note"
                            >ราคาและไฟล์อ้างอิงข้อมูลจากขั้น Cost Saving</span
                          >
                        </td>
                      </tr>

                      <tr class="pfc-row-highlight">
                        <td class="pfc-td-label">Price</td>
                        <td
                          v-for="(vq, vi) in currentVendorQuotes"
                          :key="vi"
                          class="pfc-td-num"
                        >
                          <span class="pfc-static">{{ vq.finalPrice ?? vq.price ?? "-" }}</span>
                        </td>
                      </tr>
                      <tr class="pfc-row-highlight">
                        <td class="pfc-td-label">Quotation Files</td>
                        <td
                          v-for="(vq, vi) in currentVendorQuotes"
                          :key="vi"
                          class="pfc-td-center"
                        >
                          <a
                            v-if="vq.finalQuotationFilePath || vq.quotationFilePath"
                            :href="vq.finalQuotationFilePath || vq.quotationFilePath"
                            target="_blank"
                            class="pfc-file-link"
                          >
                            <i class="pi pi-file-pdf"></i> ดูไฟล์
                          </a>
                          <span v-else class="pfc-static">-</span>
                        </td>
                      </tr>
                      <tr class="pfc-row-highlight">
                        <td class="pfc-td-label">Purchase Recommended</td>
                        <td
                          v-for="(vq, vi) in currentVendorQuotes"
                          :key="vi"
                          class="pfc-td-center"
                        >
                          <div
                            v-if="vq.isRecommended"
                            class="pfc-badge-pill pfc-badge-pill--reco"
                          >
                            <i class="pi pi-check-circle"></i> Recommended
                          </div>
                          <span v-else class="pfc-static">-</span>
                        </td>
                      </tr>
                      <tr class="pfc-row-highlight">
                        <td class="pfc-td-label">User Choose</td>
                        <td
                          v-for="(vq, vi) in currentVendorQuotes"
                          :key="vi"
                          class="pfc-td-center"
                        >
                          <div
                            v-if="vq.isUserSelected"
                            class="pfc-badge-pill pfc-badge-pill--chosen"
                          >
                            <i class="pi pi-user"></i> เลือกแล้ว
                          </div>
                          <span v-else class="pfc-static">-</span>
                        </td>
                      </tr>
                      <tr class="pfc-row-highlight">
                        <td class="pfc-td-label pfc-td-label--warn">
                          Reasons choices differ.
                        </td>
                        <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                          <span class="pfc-static">{{ vq.userDiffReason || "-" }}</span>
                        </td>
                      </tr>
                      <tr class="pfc-row-highlight">
                        <td class="pfc-td-label">Cost Saving</td>
                        <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                          <span class="pfc-static">{{ vq.costSavingReason || "-" }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else class="pfc-empty">
                  ยังไม่มี Vendor Quote สำหรับ Item นี้
                </div>

                <!-- Item navigator -->
                <div class="pfc-item-nav">
                  <button
                    class="pfc-nav-btn"
                    :disabled="activeItemIndex === 0"
                    @click="prevItem"
                  >
                    <i class="pi pi-chevron-left"></i>
                  </button>
                  <span class="pfc-nav-label"
                    >Item {{ activeItemIndex + 1 }} /
                    {{ doc.items.length }}</span
                  >
                  <button
                    class="pfc-nav-btn"
                    :disabled="activeItemIndex === doc.items.length - 1"
                    @click="nextItem"
                  >
                    <i class="pi pi-chevron-right"></i>
                  </button>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="pfc-footer">
              <span class="pfc-role-badge">🏢 Purchase Confirm</span>
              <div class="pfc-footer-actions">
                <button class="pfc-btn pfc-btn--ghost" @click="closeDrawer">
                  Cancel
                </button>
                <button
                  class="pfc-btn pfc-btn--secondary"
                  :disabled="isBacking || isApproving"
                  @click="backToCompare"
                >
                  <i
                    :class="
                      isBacking ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-left'
                    "
                  ></i>
                  {{ isBacking ? "กำลังย้อนกลับ..." : "Back Compare" }}
                </button>
                <button
                  class="pfc-btn pfc-btn--primary"
                  :disabled="isApproving || isBacking"
                  @click="requestApprove"
                >
                  <i
                    :class="
                      isApproving ? 'pi pi-spin pi-spinner' : 'pi pi-check'
                    "
                  ></i>
                  {{ isApproving ? "กำลังอนุมัติ..." : "Approve" }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Approve Confirm Popup -->
  <Teleport to="body">
    <Transition name="pfc-confirm-fade">
      <div v-if="showApproveConfirm" class="pfc-confirm-overlay">
        <div class="pfc-confirm-box" role="alertdialog" aria-modal="true">
          <p class="pfc-confirm-msg">
            ยืนยันการอนุมัติ RFQ นี้? หลังจากนี้สถานะจะเปลี่ยนเป็น Finish
            และไม่สามารถแก้ไขได้อีก
          </p>
          <div class="pfc-confirm-actions">
            <button
              class="pfc-btn pfc-btn--ghost"
              @click="showApproveConfirm = false"
            >
              Cancel
            </button>
            <button
              class="pfc-btn pfc-btn--primary"
              :disabled="isApproving"
              @click="confirmApprove"
            >
              {{ isApproving ? "กำลังส่ง..." : "Confirm" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");

.pfc-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
}
.pfc-fade-enter-active {
  transition: opacity 0.25s ease;
}
.pfc-fade-leave-active {
  transition: opacity 0.28s ease;
}
.pfc-fade-enter-from,
.pfc-fade-leave-to {
  opacity: 0;
}
.pfc-slide-enter-active {
  animation: pfcSlideIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.pfc-slide-leave-active {
  animation: pfcSlideOut 0.28s cubic-bezier(0.4, 0, 1, 1) both;
}
@keyframes pfcSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes pfcSlideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.pfc-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
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

.pfc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
}
.pfc-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pfc-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Sora", sans-serif;
  font-size: 11px;
  font-weight: 700;
}
.pfc-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px;
}
.pfc-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}
.pfc-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.pfc-close:hover {
  background: var(--resent-bg);
  color: var(--resent);
  border-color: var(--resent-border);
}

.pfc-pipeline {
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
  overflow-x: auto;
}
.pfc-pipeline-track {
  display: flex;
  align-items: center;
  min-width: max-content;
}
.pfc-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 76px;
}
.pfc-node {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.pfc-step-label {
  font-size: 9.5px;
  font-weight: 500;
  text-align: center;
  line-height: 1.3;
  white-space: pre-line;
}
.pfc-num {
  font-size: 11px;
  font-weight: 700;
}
.pfc-step--done .pfc-node {
  background: var(--accept-bg);
  border: 1.5px solid var(--accept-border);
  color: var(--accept);
}
.pfc-step--done .pfc-step-label {
  color: var(--accept);
}
.pfc-step--active .pfc-node {
  background: var(--accent-dim);
  border: 2px solid var(--accent);
  color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-dim);
}
.pfc-step--active .pfc-step-label {
  color: var(--accent);
  font-weight: 700;
}
.pfc-step--rejected .pfc-node {
  background: rgba(239, 68, 68, 0.12);
  border: 1.5px solid #ef4444;
  color: #ef4444;
}
.pfc-step--rejected .pfc-step-label {
  color: #ef4444;
}
.pfc-step--pending .pfc-node {
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-subtle);
  color: var(--text-muted);
}
.pfc-step--pending .pfc-step-label {
  color: var(--text-muted);
}
.pfc-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pfcPulse 1.6s ease-in-out infinite;
}
.pfc-x {
  font-size: 12px;
  font-weight: 700;
}
@keyframes pfcPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.7;
  }
}
.pfc-arrow {
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  color: var(--border-subtle);
  min-width: 18px;
  justify-content: center;
}
.pfc-arrow--done {
  color: var(--accept-border);
}

.pfc-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
}
.pfc-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}
.pfc-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.pfc-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.pfc-meta-cell {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pfc-meta-cell span {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pfc-meta-cell strong {
  font-size: 12.5px;
  color: var(--text-primary);
  font-weight: 500;
}

.pfc-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  margin-bottom: 18px;
}
.pfc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.pfc-table th,
.pfc-table td {
  padding: 9px 14px;
  border: 1px solid var(--border-subtle);
  text-align: left;
  vertical-align: middle;
  line-height: 1.45;
}
.pfc-table tbody tr:not(.pfc-section-row):hover td {
  background: color-mix(in srgb, var(--accent-dim) 25%, transparent);
}
.pfc-table tr > *:first-child {
  border-left: none;
}
.pfc-table tr > *:last-child {
  border-right: none;
}
.pfc-table thead tr > * {
  border-top: none;
}
.pfc-table tbody tr:last-child > * {
  border-bottom: none;
}
.pfc-th-detail {
  background: var(--bg-elevated);
  font-weight: 700;
  color: var(--text-secondary);
  width: 200px;
}
.pfc-th-vendor {
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 700;
  text-align: center;
  min-width: 150px;
}
.pfc-th-vendor--reco {
  background: var(--accept-bg);
  color: var(--accept);
}
.pfc-td-label {
  background: var(--bg-elevated);
  font-weight: 600;
  color: var(--text-secondary);
}
.pfc-td-label--warn {
  color: var(--resent, #ef4444);
}
.pfc-static {
  color: var(--text-primary);
}
.pfc-note {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--text-muted);
  margin-left: 8px;
}
.pfc-section-row td {
  background: var(--bg-elevated) !important;
  border-left: none !important;
  border-right: none !important;
  padding: 7px 14px !important;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--text-muted);
}
.pfc-section-row--final td {
  color: var(--accent);
}
.pfc-td-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.pfc-td-center {
  text-align: center;
}
.pfc-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.pfc-badge-pill--reco {
  background: var(--accept-bg);
  border: 1px solid var(--accept-border);
  color: var(--accept);
}
.pfc-badge-pill--chosen {
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
}
.pfc-file-link {
  color: var(--accent);
  font-size: 12px;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pfc-item-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 0;
}
.pfc-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
}
.pfc-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.pfc-nav-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.pfc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
}
.pfc-role-badge {
  font-size: 11.5px;
  font-weight: 600;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  padding: 3px 10px;
  border-radius: 6px;
}
.pfc-footer-actions {
  display: flex;
  gap: 8px;
}
.pfc-btn {
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pfc-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pfc-btn--ghost {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.pfc-btn--ghost:hover {
  background: var(--bg-elevated);
}
.pfc-btn--secondary {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.pfc-btn--secondary:not(:disabled):hover {
  background: var(--accent-dim);
  border-color: var(--accent-glow);
  color: var(--accent);
}
.pfc-btn--primary {
  font-family: "Sora", sans-serif;
  font-weight: 700;
  border: none;
  color: var(--text-primary-help);
  background: linear-gradient(135deg, var(--orb-1), var(--accent));
  box-shadow: 0 4px 14px var(--accent-glow);
}
.pfc-btn--primary:not(:disabled):hover {
  transform: translateY(-1px);
}

.pfc-confirm-fade-enter-active {
  transition: opacity 0.18s ease;
}
.pfc-confirm-fade-leave-active {
  transition: opacity 0.16s ease;
}
.pfc-confirm-fade-enter-from,
.pfc-confirm-fade-leave-to {
  opacity: 0;
}
.pfc-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.pfc-confirm-box {
  width: 100%;
  max-width: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.pfc-confirm-msg {
  font-size: 13.5px;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0 0 18px;
  text-align: center;
}
.pfc-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>