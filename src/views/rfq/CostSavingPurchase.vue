<script setup>
import { nextTick, ref, watch, computed } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_API_URL}`;

const isLoading = ref(false);
const isSavingCost = ref(false);
const isConfirming = ref(false);
const isBacking = ref(false);
const doc = ref(null);
const showConfirmPopup = ref(false);
const finalInputs = ref({});

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
  const raw = (doc.value.status ?? doc.value.Status ?? "").toString().trim().toLowerCase();
  const cur = order.indexOf(raw);
  const idx = order.indexOf(stepId);
  if (cur === -1) return "pending";
  if (idx < cur) return "done";
  if (idx === cur) return "active";
  return "pending";
}

async function fetchDetail() {
  if (!drawer.docRequestId) return;
  isLoading.value = true;
  try {
    const res = await apiFetch(`${BASE}/api/doc-request/${drawer.docRequestId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    doc.value = await res.json();
    initFinalInputs();
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

function initFinalInputs() {
  if (!doc.value) return;
  const next = {};
  doc.value.items.forEach((item) => {
    const sel = selectedVendorOf(item);
    next[item.id] = {
      finalPrice: sel?.finalPrice ?? sel?.price ?? null,
      finalDiscount: sel?.finalDiscount ?? sel?.discount ?? null,
      finalRemark: sel?.finalRemark ?? "",
      reason: sel?.costSavingReason ?? "",
      newFile: null,
    };
  });
  finalInputs.value = next;
}

watch(
  () => [drawer.docRequestId, drawer.showDrawer, drawer.drawerRole],
  async ([id, show, role]) => {
    await nextTick();
    if (id && show && role === "cost_saving") {
      doc.value = null;
      finalInputs.value = {};
      await fetchDetail();
    }
  },
  { immediate: true },
);

function selectedVendorOf(item) {
  return item?.vendorQuotes?.find((vq) => vq.isUserSelected) ?? null;
}

function priceDiffers(item) {
  const sel = selectedVendorOf(item);
  const input = finalInputs.value[item.id];
  if (!sel || !input) return false;
  if (input.finalPrice == null || sel.price == null) return false;
  return Number(input.finalPrice) !== Number(sel.price);
}

function onFinalFileChange(event, itemId) {
  const file = event.target.files[0] ?? null;
  if (finalInputs.value[itemId]) finalInputs.value[itemId].newFile = file;
}

async function saveCostSavingItem(item) {
  const sel = selectedVendorOf(item);
  const input = finalInputs.value[item.id];

  isSavingCost.value = true;
  try {
    const formData = new FormData();
    if (input.finalPrice != null && input.finalPrice !== "")
      formData.append("FinalPrice", input.finalPrice);
    if (input.finalDiscount != null && input.finalDiscount !== "")
      formData.append("FinalDiscount", input.finalDiscount);
    formData.append("FinalRemark", input.finalRemark ?? "");
    formData.append(
      "CostSavingReason",
      priceDiffers(item) ? (input.reason?.trim() ?? "") : "",
    );
    if (input.newFile) formData.append("FinalQuotationFile", input.newFile);

    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/items/${item.id}/cost-saving`,
      { method: "PUT", body: formData },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    return true;
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "บันทึกไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
    return false;
  } finally {
    isSavingCost.value = false;
  }
}

// Validate Aleady Selected Vendor for Each Item and Reason 
function validateAllItemsReady() {
  if (!doc.value?.items?.length) return false;

  for (const item of doc.value.items) {
    const sel = selectedVendorOf(item);
    const input = finalInputs.value[item.id];

    if (!sel) {
      toast.add({
        severity: "warn",
        summary: "ไม่พบ Vendor ที่ User เลือก",
        detail: `Item นี้ยังไม่มี Vendor ที่ User Confirm เลือกไว้`,
        life: 3500,
      });
      return false;
    }

    if (priceDiffers(item) && !input?.reason?.trim()) {
      toast.add({
        severity: "warn",
        summary: "กรุณากรอกเหตุผล",
        detail: "ราคาสุดท้ายไม่ตรงกับราคาที่ User เลือกไว้ ต้องกรอกในช่อง Reasons choices differ",
        life: 4500,
      });
      return false;
    }
  }

  return true;
}

function requestConfirmCostSaving() {
  if (!validateAllItemsReady()) return;
  showConfirmPopup.value = true;
}

// ── Confirm Cost Saving ─────────────
async function confirmCostSaving() {
  isConfirming.value = true;
  try {
    for (const item of doc.value.items) {
      const ok = await saveCostSavingItem(item);
      if (!ok) {
        // เซฟไม่ผ่าน หยุดทันที 
        return;
      }
    }

    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/cost-saving/confirm`,
      { method: "POST" },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    toast.add({
      severity: "success",
      summary: "ยืนยันสำเร็จ",
      detail: "ส่งต่อให้ Purchase Confirm แล้ว",
      life: 4000,
    });
    showConfirmPopup.value = false;
    drawer.closeDrawer();
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
      severity: "info",
      summary: "ย้อนกลับแล้ว",
      detail: "กลับไปยังขั้นตอน Purchase Compare",
      life: 3000,
    });
    drawer.closeDrawer();
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

function closeDrawer() {
  if (isConfirming.value) return;
  drawer.showDrawer = false;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cs-fade">
      <div
        v-if="drawer.showDrawer && drawer.drawerRole === 'cost_saving'"
        class="cs-overlay"
        @click.self="closeDrawer"
      >
        <Transition name="cs-slide" appear>
          <div class="cs-panel" role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="cs-header">
              <div class="cs-header-left">
                <div class="cs-badge">RFQ</div>
                <div>
                  <h2 class="cs-title">Cost Saving</h2>
                  <span class="cs-sub">
                    {{ doc?.rfqNo }} · {{ doc?.revNo }} ·
                    {{ doc?.items?.length ?? 0 }} Items
                  </span>
                </div>
              </div>
              <button class="cs-close" @click="closeDrawer">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Pipeline -->
            <div class="cs-pipeline">
              <div class="cs-pipeline-track">
                <template v-for="(step, i) in allSteps" :key="step.id">
                  <div class="cs-step" :class="`cs-step--${stepStatus(step.id)}`">
                    <div class="cs-node">
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
                      <span v-else-if="stepStatus(step.id) === 'active'" class="cs-pulse" />
                      <span v-else class="cs-num">{{ i + 1 }}</span>
                    </div>
                    <span class="cs-step-label">{{ step.label }}</span>
                  </div>
                  <div
                    v-if="i < allSteps.length - 1"
                    class="cs-arrow"
                    :class="{ 'cs-arrow--done': stepStatus(step.id) === 'done' }"
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

            <!-- Body -->
            <div class="cs-body">
              <div v-if="isLoading" class="cs-loading">
                <i class="pi pi-spin pi-spinner"></i> กำลังโหลด...
              </div>

              <template v-else-if="doc">
                <!-- Meta -->
                <div class="cs-meta">
                  <span class="cs-meta-item">
                    <i class="pi pi-user"></i> {{ doc.requesterEmail }}
                  </span>
                  <span class="cs-meta-item">
                    <i class="pi pi-calendar"></i> {{ doc.createdAt }}
                  </span>
                  <span v-if="doc.purchaserEmail" class="cs-meta-item">
                    <i class="pi pi-briefcase"></i> {{ doc.purchaserEmail }}
                  </span>
                </div>

                <!-- Items -->
                <div v-for="(item, index) in doc.items" :key="item.id" class="cs-item">
                  <div class="cs-item-header">
                    <span class="cs-item-label">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <path d="M3 9h18M9 21V9" />
                      </svg>
                      Item {{ String(index + 1).padStart(2, "0") }}
                    </span>
                  </div>

                  <!-- General Info / Product Spec (read-only) -->
                  <div class="cs-grid">
                    <div class="cs-col">
                      <div class="cs-col-title">General Info</div>
                      <div class="cs-row">
                        <div class="cs-field">
                          <label>Target PUR Reply</label>
                          <div class="cs-view">{{ item.targetPURreply ?? "-" }}</div>
                        </div>
                        <div class="cs-field">
                          <label>GL Code</label>
                          <div class="cs-view">{{ item.glCode ?? "-" }}</div>
                        </div>
                      </div>
                      <div class="cs-field">
                        <label>Project Name</label>
                        <div class="cs-view">{{ item.projectName ?? "-" }}</div>
                      </div>
                      <div class="cs-field">
                        <label>SAP Item No.</label>
                        <div class="cs-view">{{ item.sapItem ?? "-" }}</div>
                      </div>
                      <div class="cs-field">
                        <label>Item Description</label>
                        <div class="cs-view">{{ item.itemDescription ?? "-" }}</div>
                      </div>
                    </div>

                    <div class="cs-divider"></div>

                    <div class="cs-col">
                      <div class="cs-col-title">Product Specification</div>
                      <div class="cs-row">
                        <div class="cs-field">
                          <label>Type</label>
                          <div class="cs-view">{{ item.type ?? "-" }}</div>
                        </div>
                        <div class="cs-field">
                          <label>Spec / Purity</label>
                          <div class="cs-view">{{ item.specPurity ?? "-" }}</div>
                        </div>
                      </div>
                      <div class="cs-field">
                        <label>Cylinder Type</label>
                        <div class="cs-view">{{ item.cylinderType ?? "-" }}</div>
                      </div>
                      <div class="cs-row">
                        <div class="cs-field">
                          <label>Quantity</label>
                          <div class="cs-view">{{ item.quantity ?? "-" }}</div>
                        </div>
                        <div class="cs-field">
                          <label>UOM</label>
                          <div class="cs-view">{{ item.uom ?? "-" }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Vendor Selected First Price vs Final Price -->
                  <div class="cs-table-wrap">
                    <table class="cs-table" v-if="selectedVendorOf(item)">
                      <thead>
                        <tr>
                          <th class="cs-th-detail">Detail</th>
                          <th class="cs-th-first">Vendor Selected First Price</th>
                          <th class="cs-th-final">Vendor Selected Final Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="cs-td-label">Item description</td>
                          <td class="cs-td-readonly">
                            {{ selectedVendorOf(item).itemDescription || "-" }}
                          </td>
                          <td class="cs-td-editable">
                            {{ selectedVendorOf(item).itemDescription || "-" }}
                          </td>
                        </tr>
                        <tr>
                          <td class="cs-td-label">Specification / Part no.</td>
                          <td class="cs-td-readonly">
                            {{ selectedVendorOf(item).specPartNo || "-" }}
                          </td>
                          <td class="cs-td-editable">
                            {{ selectedVendorOf(item).specPartNo || "-" }}
                          </td>
                        </tr>
                        <tr>
                          <td class="cs-td-label">Model</td>
                          <td class="cs-td-readonly">
                            {{ selectedVendorOf(item).model || "-" }}
                          </td>
                          <td class="cs-td-editable">
                            {{ selectedVendorOf(item).model || "-" }}
                          </td>
                        </tr>
                        <tr>
                          <td class="cs-td-label">Remark</td>
                          <td class="cs-td-readonly">
                            {{ selectedVendorOf(item).remark || "-" }}
                          </td>
                          <td class="cs-td-editable">
                            <input
                              v-model="finalInputs[item.id].finalRemark"
                              type="text"
                              class="cs-input"
                              placeholder="Insert text"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td class="cs-td-label">Price</td>
                          <td class="cs-td-readonly">
                            {{ selectedVendorOf(item).price ?? "-" }}
                          </td>
                          <td class="cs-td-editable">
                            <input
                              v-model="finalInputs[item.id].finalPrice"
                              type="number"
                              step="0.01"
                              class="cs-input"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td class="cs-td-label">Discount</td>
                          <td class="cs-td-readonly">
                            {{ selectedVendorOf(item).discount ?? "-" }}
                          </td>
                          <td class="cs-td-editable">
                            <input
                              v-model="finalInputs[item.id].finalDiscount"
                              type="number"
                              step="0.01"
                              class="cs-input"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td class="cs-td-label">Quotation Files</td>
                          <td class="cs-td-readonly">
                            <a
                              v-if="selectedVendorOf(item).quotationFilePath"
                              :href="selectedVendorOf(item).quotationFilePath"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="cs-file-link"
                            >
                              <i class="pi pi-file-pdf"></i> ดูไฟล์
                            </a>
                            <span v-else>-</span>
                          </td>
                          <td class="cs-td-editable">
                            <label class="cs-file-btn">
                              <i class="pi pi-upload"></i>
                              {{ finalInputs[item.id]?.newFile?.name || "แนบไฟล์ใหม่" }}
                              <input
                                type="file"
                                class="cs-file-hidden"
                                accept=".pdf,.png,.jpg,.jpeg"
                                @change="onFinalFileChange($event, item.id)"
                              />
                            </label>
                          </td>
                        </tr>
                        <tr class="cs-row-warn">
                          <td class="cs-td-label cs-td-label--warn">
                            Reasons choices differ.
                          </td>
                          <td class="cs-td-readonly">-</td>
                          <td class="cs-td-editable">
                            <input
                              v-model="finalInputs[item.id].reason"
                              type="text"
                              class="cs-input"
                              :class="{
                                'cs-input--required':
                                  priceDiffers(item) && !finalInputs[item.id]?.reason?.trim(),
                              }"
                              :placeholder="
                                priceDiffers(item)
                                  ? 'จำเป็นต้องระบุเหตุผล (บังคับกรอก)'
                                  : 'Insert text'
                              "
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div v-else class="cs-empty">
                      <i class="pi pi-exclamation-triangle"></i>
                      Item นี้ยังไม่มี Vendor ที่ User เลือกไว้ (ยังไม่ผ่านขั้น User Confirm)
                    </div>
                  </div>

                  <p v-if="priceDiffers(item)" class="cs-differ-hint">
                    <i class="pi pi-exclamation-triangle"></i>
                    ราคาสุดท้ายไม่ตรงกับราคาที่ User เลือกไว้ — ต้องกรอกเหตุผลในช่อง
                    "Reasons choices differ" ก่อนจึงจะยืนยันได้
                  </p>

                  <div v-if="index < doc.items.length - 1" class="cs-item-divider"></div>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="cs-footer">
              <span class="cs-role-badge">🏢 Cost Saving</span>
              <div class="cs-footer-actions">
                <button class="cs-btn cs-btn--ghost" :disabled="isSavingCost" @click="closeDrawer">
                  Cancel
                </button>
                <button
                  class="cs-btn cs-btn--outline"
                  :disabled="isBacking || isSavingCost || isConfirming"
                  @click="backToCompare"
                >
                  <i :class="isBacking ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-left'"></i>
                  Back Compare
                </button>
                <button
                  class="cs-btn cs-btn--primary"
                  :disabled="isSavingCost || isConfirming"
                  @click="requestConfirmCostSaving"
                >
                  <i
                    :class="
                      isSavingCost || isConfirming
                        ? 'pi pi-spin pi-spinner'
                        : 'pi pi-check'
                    "
                  ></i>
                  {{ isSavingCost ? "กำลังบันทึก..." : "Cost Saving" }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Confirm Popup -->
  <Teleport to="body">
    <Transition name="cs-confirm-fade">
      <div v-if="showConfirmPopup" class="cs-confirm-overlay">
        <div class="cs-confirm-box" role="alertdialog" aria-modal="true">
          <p class="cs-confirm-msg">
            ยืนยันราคาสุดท้าย (Final Price) ทั้งหมด?<br />
            หลังจากนี้จะส่งต่อให้ขั้นตอน Purchase Confirm
          </p>
          <div class="cs-confirm-actions">
            <button
              class="cs-btn cs-btn--ghost"
              :disabled="isConfirming"
              @click="showConfirmPopup = false"
            >
              Cancel
            </button>
            <button
              class="cs-btn cs-btn--primary"
              :disabled="isConfirming"
              @click="confirmCostSaving"
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

.cs-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
}
.cs-fade-enter-active { transition: opacity 0.25s ease; }
.cs-fade-leave-active { transition: opacity 0.28s ease; }
.cs-fade-enter-from, .cs-fade-leave-to { opacity: 0; }
.cs-slide-enter-active { animation: csSlideIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both; }
.cs-slide-leave-active { animation: csSlideOut 0.28s cubic-bezier(0.4, 0, 1, 1) both; }
@keyframes csSlideIn {
  from { transform: translateX(100%); opacity: 0.6; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes csSlideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

.cs-panel {
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

.cs-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0; background: var(--bg-surface);
}
.cs-header-left { display: flex; align-items: center; gap: 12px; }
.cs-badge {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--accent-glow, rgba(56,163,245,0.25));
  color: var(--accent, #38a3f5);
  display: flex; align-items: center; justify-content: center;
  font-family: "Sora", sans-serif; font-size: 11px; font-weight: 700;
}
.cs-title { font-family: "Sora", sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px; }
.cs-sub { font-size: 11.5px; color: var(--text-muted); }
.cs-close {
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.cs-close:hover { background: var(--resent-bg); color: var(--resent); border-color: var(--resent-border); }

.cs-pipeline { padding: 14px 24px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; background: var(--bg-surface); overflow-x: auto; }
.cs-pipeline-track { display: flex; align-items: center; min-width: max-content; }
.cs-step { display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 76px; }
.cs-node { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.cs-step-label { font-size: 9.5px; font-weight: 500; text-align: center; line-height: 1.3; white-space: pre-line; }
.cs-num { font-size: 11px; font-weight: 700; }
.cs-step--done .cs-node { background: var(--accept-bg); border: 1.5px solid var(--accept-border); color: var(--accept); }
.cs-step--done .cs-step-label { color: var(--accept); }
.cs-step--active .cs-node {
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 2px solid var(--accent, #38a3f5);
  color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 4px var(--accent-dim, rgba(56,163,245,0.15));
}
.cs-step--active .cs-step-label { color: var(--accent, #38a3f5); font-weight: 700; }
.cs-step--pending .cs-node { background: var(--bg-elevated); border: 1.5px solid var(--border-subtle); color: var(--text-muted); }
.cs-step--pending .cs-step-label { color: var(--text-muted); }
.cs-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--accent, #38a3f5); animation: csPulse 1.6s ease-in-out infinite; }
@keyframes csPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.7; }
}
.cs-arrow { flex: 1; display: flex; align-items: flex-start; padding-top: 6px; color: var(--border-subtle); min-width: 18px; justify-content: center; }
.cs-arrow--done { color: var(--accept-border); }

.cs-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px; }
.cs-loading { display: flex; align-items: center; gap: 10px; justify-content: center; padding: 60px 0; color: var(--text-muted); }

.cs-meta { display: flex; gap: 20px; padding: 10px 0 16px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px; flex-wrap: wrap; }
.cs-meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
.cs-meta-item i { color: var(--accent, #38a3f5); }

.cs-item { margin-bottom: 8px; }
.cs-item-header { display: flex; align-items: center; padding: 10px 0 12px; margin-bottom: 16px; border-bottom: 1px solid var(--border-accent); }
.cs-item-label { display: flex; align-items: center; gap: 7px; font-family: "Sora", sans-serif; font-size: 13px; font-weight: 700; color: var(--accent, #38a3f5); }
.cs-item-divider { height: 1px; background: var(--border-subtle); margin: 24px 0; }

.cs-grid { display: grid; grid-template-columns: 1fr 1px 1fr; gap: 0 20px; margin-bottom: 20px; }
.cs-divider { background: var(--border-subtle); }
.cs-col { display: flex; flex-direction: column; gap: 0; }
.cs-col-title {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--accent, #38a3f5); margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);
}
.cs-field { margin-bottom: 12px; }
.cs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.cs-field label {
  display: block; font-size: 10.5px; font-weight: 600; color: var(--text-muted);
  margin-bottom: 5px; letter-spacing: 0.06em; text-transform: uppercase;
}
.cs-view {
  min-height: 37px; display: flex; align-items: center;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 8px; color: var(--text-primary); font-size: 13px; padding: 8px 11px;
}

.cs-table-wrap { overflow-x: auto; border: 1px solid var(--border-subtle); border-radius: 12px; margin-bottom: 12px; }
.cs-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.cs-table th, .cs-table td { padding: 8px 12px; border: 1px solid var(--border-subtle); text-align: left; vertical-align: middle; }
.cs-table tr > *:first-child { border-left: none; }
.cs-table tr > *:last-child { border-right: none; }
.cs-table thead tr > * { border-top: none; }
.cs-table tbody tr:last-child > * { border-bottom: none; }
.cs-th-detail { background: var(--bg-elevated); font-weight: 700; color: var(--text-secondary); width: 180px; }
.cs-th-first {
  background: color-mix(in srgb, var(--bg-elevated) 60%, var(--accent-dim, rgba(56,163,245,0.15)));
  color: var(--text-secondary); font-weight: 700; text-align: center; min-width: 160px;
}
.cs-th-final { background: var(--accent-dim, rgba(56,163,245,0.15)); color: var(--accent, #38a3f5); font-weight: 700; text-align: center; min-width: 160px; }
.cs-td-label { background: var(--bg-elevated); font-weight: 600; color: var(--text-secondary); }
.cs-td-label--warn { color: var(--resent, #ef4444); }
.cs-td-readonly { color: var(--text-secondary); background: var(--bg-elevated); }
.cs-td-editable { background: color-mix(in srgb, var(--accent-dim, rgba(56,163,245,0.15)) 30%, transparent); }
.cs-input {
  width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-subtle);
  border-radius: 6px; color: var(--text-primary); padding: 6px 8px; font-size: 12.5px; box-sizing: border-box;
}
.cs-input:focus { outline: none; border-color: var(--accent, #38a3f5); }
.cs-input--required { border-color: var(--resent, #ef4444); box-shadow: 0 0 0 2px color-mix(in srgb, var(--resent, #ef4444) 25%, transparent); }
.cs-file-link { color: var(--accent, #38a3f5); font-size: 11.5px; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px; }
.cs-file-btn {
  display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 6px;
  border: 1px dashed var(--border-subtle); font-size: 11.5px; color: var(--text-secondary); cursor: pointer;
}
.cs-file-hidden { display: none; }
.cs-empty {
  display: flex; align-items: center; gap: 8px; justify-content: center;
  padding: 24px; color: var(--text-muted); font-size: 12.5px;
}

.cs-differ-hint {
  display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600;
  color: var(--resent, #ef4444); background: color-mix(in srgb, var(--resent, #ef4444) 12%, transparent);
  border: 1px dashed var(--resent, #ef4444); border-radius: 8px; padding: 8px 12px; margin-bottom: 14px;
}

.cs-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px; border-top: 1px solid var(--border-subtle); flex-shrink: 0; background: var(--bg-surface);
}
.cs-role-badge {
  font-size: 11.5px; font-weight: 600;
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--accent-glow, rgba(56,163,245,0.25));
  color: var(--accent, #38a3f5);
  padding: 3px 10px; border-radius: 6px;
}
.cs-footer-actions { display: flex; gap: 8px; }
.cs-btn {
  padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: "DM Sans", sans-serif; display: flex; align-items: center; gap: 6px;
}
.cs-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.cs-btn--ghost { background: transparent; border: 1px solid var(--border-subtle); color: var(--text-secondary); }
.cs-btn--ghost:hover:not(:disabled) { background: var(--bg-elevated); }
.cs-btn--outline { background: transparent; border: 1px solid var(--accent-glow, rgba(56,163,245,0.25)); color: var(--accent, #38a3f5); }
.cs-btn--outline:hover:not(:disabled) { background: var(--accent-dim, rgba(56,163,245,0.12)); }
.cs-btn--primary {
  font-family: "Sora", sans-serif; font-weight: 700; border: none; color: var(--text-primary-help);
  background: linear-gradient(135deg, var(--orb-1), var(--accent));
  box-shadow: 0 4px 14px var(--accent-glow, rgba(56,163,245,0.25));
}
.cs-btn--primary:not(:disabled):hover { transform: translateY(-1px); }

.cs-confirm-fade-enter-active { transition: opacity 0.18s ease; }
.cs-confirm-fade-leave-active { transition: opacity 0.16s ease; }
.cs-confirm-fade-enter-from, .cs-confirm-fade-leave-to { opacity: 0; }
.cs-confirm-overlay {
  position: fixed; inset: 0; z-index: 1100; background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.cs-confirm-box {
  width: 100%; max-width: 400px; background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: 14px; padding: 22px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.cs-confirm-msg { font-size: 13.5px; color: var(--text-primary); line-height: 1.5; margin: 0 0 18px; text-align: center; }
.cs-confirm-actions { display: flex; justify-content: center; gap: 10px; }
</style>