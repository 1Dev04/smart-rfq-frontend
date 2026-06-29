<script setup>
import { nextTick, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_LOCAL_BACKEND}`;

// ── Vendor Email Modal ──────────────────────────────────
const showEmailModal = ref(false)
const vendorEmails   = ref([''])
const isSending      = ref(false)

const isLoading = ref(false);
const isSubmitting = ref(false);
const doc = ref(null);
const leadTimes = ref({});


const allSteps = [
  { id: "user_fill",         label: "User Fill\nData (Draft)" },
  { id: "purchase_accept",   label: "Purchase\nAccept" },
  { id: "waiting_quotation", label: "Waiting\nQuotation" },  
  { id: "purchase_compare",  label: "Purchase\nCompare" },
  { id: "user_confirm",      label: "User\nConfirm" },
  { id: "purchase_confirm",  label: "Purchase\nConfirm" },
  { id: "finish",            label: "Finish" },
];

function statusLabel(statusId) {
  return (
    allSteps.find((s) => s.id === statusId)?.label?.replace("\n", " ") ??
    statusId
  );
}

function stepStatus(stepId) {
  if (!doc.value) return "pending";
  const order = allSteps.map((s) => s.id);
  const cur = order.indexOf(doc.value.status);
  const idx = order.indexOf(stepId);
  
  if (cur === -1) return "pending";
  if (idx <= cur) return "done";       
  if (idx === cur + 1) return "active"; 
  return "pending";
}

function addEmailField() { vendorEmails.value.push('')}
function removeEmail(i) { vendorEmails.value.splice(i, 1)}

async function openPurchaseDrawer(docRequestId) {
  // ดึง status จาก row ที่คลิก
  const row = allRows.value.find(r => r.docRequestId === docRequestId)
  const status = row?.status

  const roleMap = {
    purchase_accept:   'purchase',
    waiting_quotation: 'waiting',
    // เพิ่ม state ต่อไปได้
  }
  const drawerRole = roleMap[status] ?? (auth.role === 'purchaser' ? 'purchase' : auth.role)

  drawer.closeDrawer()
  await nextTick()
  drawer.openDrawer(drawerRole, null, docRequestId)
}

// Helper
function parseThaiDate(dateStr) {
  if (!dateStr) return null;

  const [day, month, year] = dateStr.split("/");
  return new Date(`20${year}-${month}-${day}`);
}

async function fetchDetail() {
  if (!drawer.docRequestId) return;
  isLoading.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    doc.value = await res.json();
    doc.value.items.forEach((item) => {
      leadTimes.value[item.id] = item.leadTimeDays ?? "";
    });
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
    if (id && show && role === "purchase") {
      doc.value = null;
      leadTimes.value = {};
      fetchDetail();
    }
  },
  { immediate: true },
);

async function handleAccept() {
  isSubmitting.value = true;
  try {
    const payload = {
      itemLeadTimes: Object.fromEntries(
        Object.entries(leadTimes.value).map(([k, v]) => [Number(k), Number(v)]),
      ),
    };
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/accept`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.add({
        severity: "error",
        summary: "Accept failed",
        detail: body.message,
        life: 6000,
      });
      return;
    }
    toast.add({
      severity: "success",
      summary: "Accepted",
      detail: "RFQ accepted and moved to next step.",
      life: 4000,
    });
    drawer.closeDrawer();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Network error",
      detail: err.message,
      life: 6000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleReject() {
  isSubmitting.value = true;
  try {
    const res = await apiFetch(`${BASE}/api/doc-request/reject`, {
      method: "POST",
      body: JSON.stringify({ id: drawer.docRequestId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.add({
        severity: "error",
        summary: "Reject failed",
        detail: body.message,
        life: 6000,
      });
      return;
    }

    toast.add({
      severity: "warn",
      summary: "Rejected",
      detail: "RFQ rejected and returned to requester.",
      life: 4000,
    });
    drawer.closeDrawer();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Network error",
      detail: err.message,
      life: 6000,
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="drawer.showDrawer && drawer.drawerRole === 'purchase'"
        class="pur-overlay"
        @click.self="drawer.closeDrawer()"
      >
        <Transition name="drawer-slide" appear>
          <div class="pur-panel" role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="pur-header">
              <div class="pur-header-left">
                <div class="pur-badge">RFQ</div>
                <div>
                  <h2 class="pur-title">Purchase Accept</h2>
                  <span class="pur-sub">
                    {{ doc?.rfqNo }} · {{ doc?.revNo }} ·
                    {{ doc?.items?.length ?? 0 }} Items
                  </span>
                </div>
              </div>
              <button class="pur-close" @click="drawer.closeDrawer()">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Pipeline -->
            <div class="pur-pipeline">
              <div class="pur-pipeline-track">
                <template v-for="(step, i) in allSteps" :key="step.id">
                  <div
                    class="pur-step"
                    :class="`pur-step--${stepStatus(step.id)}`"
                  >
                    <div class="pur-node">
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
                        class="pur-pulse"
                      />
                      <span v-else class="pur-num">{{ i + 1 }}</span>
                    </div>
                    <span class="pur-step-label">{{ step.label }}</span>
                  </div>
                  <div
                    v-if="i < allSteps.length - 1"
                    class="pur-arrow"
                    :class="{
                      'pur-arrow--done': stepStatus(step.id) === 'done',
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

            <!-- Body -->
            <div class="pur-body">
              <div v-if="isLoading" class="pur-loading">
                <i class="pi pi-spin pi-spinner"></i> กำลังโหลด...
              </div>

              <template v-else-if="doc">
                <!-- Meta -->
                <div class="pur-meta">
                  <span class="pur-meta-item"
                    ><i class="pi pi-user"></i> {{ doc.requesterEmail }}</span
                  >
                  <span class="pur-meta-item"
                    ><i class="pi pi-calendar"></i> {{ doc.createdAt }}</span
                  >
                  <span v-if="doc.purchaserEmail" class="pur-meta-item"
                    ><i class="pi pi-briefcase"></i>
                    {{ doc.purchaserEmail }}</span
                  >
                </div>

                <!-- Items -->
                <div
                  v-for="(item, index) in doc.items"
                  :key="item.id"
                  class="pur-item"
                >
                  <div class="pur-item-header">
                    <span class="pur-item-label">
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

                  <div class="pur-grid">
                    <!-- Left col -->
                    <div class="pur-col">
                      <div class="pur-col-title">General Info</div>
                      <div class="pur-row">
                        <div class="pur-field">
                          <label>Target PUR Reply</label>
                          <div class="pur-view">
                            {{ item.targetPURreply ?? "-" }}
                          </div>
                        </div>
                        <div class="pur-field">
                          <label>GL Code</label>
                          <div class="pur-view">{{ item.glCode ?? "-" }}</div>
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>Project Name</label>
                        <div class="pur-view">
                          {{ item.projectName ?? "-" }}
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>SAP Item No.</label>
                        <div class="pur-view">{{ item.sapItem ?? "-" }}</div>
                      </div>
                      <div class="pur-field">
                        <label>Item Description</label>
                        <div class="pur-view">
                          {{ item.itemDescription ?? "-" }}
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>Specification / Part No.</label>
                        <div class="pur-view">{{ item.specPartNo ?? "-" }}</div>
                      </div>
                      <div class="pur-row">
                        <div class="pur-field">
                          <label>Model</label>
                          <div class="pur-view">{{ item.model ?? "-" }}</div>
                        </div>
                        <div class="pur-field">
                          <label>Brand</label>
                          <div class="pur-view">{{ item.brand ?? "-" }}</div>
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>For GAS</label>
                        <div class="pur-view">{{ item.forGas ?? "-" }}</div>
                      </div>
                      <div class="pur-field">
                        <label>Attachments</label>
                        <div class="pur-attach-list">
                          <a
                            v-if="item.attachDwgPath"
                            :href="item.attachDwgPath"
                            target="_blank"
                            class="pur-attach-link"
                          >
                            <i class="pi pi-file"></i> DWG
                          </a>
                          <a
                            v-if="item.attachSpecPath"
                            :href="item.attachSpecPath"
                            target="_blank"
                            class="pur-attach-link"
                          >
                            <i class="pi pi-file"></i> Spec
                          </a>
                          <a
                            v-if="item.attachQuotationPath"
                            :href="item.attachQuotationPath"
                            target="_blank"
                            class="pur-attach-link"
                          >
                            <i class="pi pi-file"></i> Quotation
                          </a>
                          <a
                            v-if="item.attachEtcPath"
                            :href="item.attachEtcPath"
                            target="_blank"
                            class="pur-attach-link"
                          >
                            <i class="pi pi-file"></i> ETC
                          </a>
                          <span
                            v-if="
                              !item.attachDwgPath &&
                              !item.attachSpecPath &&
                              !item.attachQuotationPath &&
                              !item.attachEtcPath
                            "
                            class="pur-no-attach"
                            >ไม่มีไฟล์แนบ</span
                          >
                        </div>
                      </div>
                    </div>

                    <div class="pur-divider"></div>

                    <!-- Right col -->
                    <div class="pur-col">
                      <div class="pur-col-title">Product Specification</div>
                      <div class="pur-row">
                        <div class="pur-field">
                          <label>Type</label>
                          <div class="pur-view">{{ item.type ?? "-" }}</div>
                        </div>
                        <div class="pur-field">
                          <label>Spec / Purity</label>
                          <div class="pur-view">
                            {{ item.specPurity ?? "-" }}
                          </div>
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>Cylinder Type</label>
                        <div class="pur-view">
                          {{ item.cylinderType ?? "-" }}
                        </div>
                      </div>
                      <div class="pur-row">
                        <div class="pur-field">
                          <label>Quantity</label>
                          <div class="pur-view">{{ item.quantity ?? "-" }}</div>
                        </div>
                        <div class="pur-field">
                          <label>UOM</label>
                          <div class="pur-view">{{ item.uom ?? "-" }}</div>
                        </div>
                      </div>
                      <div class="pur-row">
                        <div class="pur-field">
                          <label>Cylinder Size (L)</label>
                          <div class="pur-view">
                            {{ item.cylinderSize ?? "-" }}
                          </div>
                        </div>
                        <div class="pur-field">
                          <label>Maker / Source</label>
                          <div class="pur-view">
                            {{ item.makerSource ?? "-" }}
                          </div>
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>Required Type Valve</label>
                        <div class="pur-view">
                          {{ item.requiredValve ?? "-" }}
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>Purpose / Application</label>
                        <div class="pur-view">
                          {{ item.purposeApplication ?? "-" }}
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>Customer</label>
                        <div class="pur-view">{{ item.customer ?? "-" }}</div>
                      </div>
                      <div class="pur-field">
                        <label>Address / Location</label>
                        <div class="pur-view">
                          {{ item.addressLocation ?? "-" }}
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>Recommend Vendor / Brand</label>
                        <div class="pur-view">
                          {{ item.recommendVendor ?? "-" }}
                        </div>
                      </div>
                      <div class="pur-field">
                        <label>Remark</label>
                        <div class="pur-view">{{ item.remark ?? "-" }}</div>
                      </div>

                      <!-- Lead Time input -->
                      <div class="pur-leadtime">
                        <label
                          >Lead Time (วัน) <span class="pur-req">*</span></label
                        >
                        <input
                          v-model="leadTimes[item.id]"
                          type="number"
                          class="pur-input"
                          min="1"
                          step="1"
                          placeholder="จำนวนวัน"
                        />
                        <span v-if="leadTimes[item.id]" class="pur-hint">
                          Purchase ต้องเริ่มดำเนินการภายใน:
                          <strong>{{
                            item.targetPURreply
                              ? (() => {
                                  const target = parseThaiDate(
                                    item.targetPURreply,
                                  );
                                  if (!target) return "-";
                                  const start = new Date(
                                    target.getTime() -
                                      leadTimes[item.id] * 86400000,
                                  );
                                  return start.toLocaleDateString("th-TH");
                                })()
                              : "-"
                          }}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="index < doc.items.length - 1"
                    class="pur-item-divider"
                  ></div>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="pur-footer">
              <div class="pur-footer-info">
                <span class="pur-role-badge">🏢 Purchase</span>
                <span class="pur-footer-hint"
                  >{{ doc?.items?.length ?? 0 }} Items ·
                  {{ statusLabel(doc?.status) }}</span
                >
              </div>
              <div class="pur-footer-actions">
                <button
                  class="pur-btn pur-btn--ghost"
                  :disabled="isSubmitting"
                  @click="drawer.closeDrawer()"
                >
                  Cancel
                </button>
                <button
                  class="pur-btn pur-btn--outline"
                  :disabled="isSubmitting"
                  @click="handleReject"
                >
                  <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
                  Reject
                </button>
                <button
                  class="pur-btn pur-btn--primary"
                  :disabled="isSubmitting"
                  @click="handleAccept"
                >
                  <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
                  Accept
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");

/* Overlay */
.pur-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
}

/* Transitions */
.drawer-fade-enter-active {
  transition: opacity 0.25s ease;
}
.drawer-fade-leave-active {
  transition: opacity 0.28s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active {
  animation: slideInRight 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.drawer-slide-leave-active {
  animation: slideOutRight 0.28s cubic-bezier(0.4, 0, 1, 1) both;
}
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Panel */
.pur-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--bg-base) 84%, var(--orb-1) 16%);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -24px 0 80px rgba(0, 0, 0, 0.45);
  font-family: "DM Sans", sans-serif;
  overflow: hidden;
}

/* Header */
.pur-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
}
.pur-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pur-badge {
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
  letter-spacing: 0.08em;
}
.pur-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px;
}
.pur-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}
.pur-close {
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
  transition:
    background 0.2s,
    color 0.2s;
}
.pur-close:hover {
  background: var(--resent-bg);
  color: var(--resent);
  border-color: var(--resent-border);
}

/* Pipeline */
.pur-pipeline {
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
  overflow-x: auto;
}
.pur-pipeline-track {
  display: flex;
  align-items: center;
  min-width: max-content;
}
.pur-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 76px;
}
.pur-node {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.3s;
}
.pur-step-label {
  font-size: 9.5px;
  font-weight: 500;
  text-align: center;
  line-height: 1.3;
  white-space: pre-line;
}
.pur-num {
  font-size: 11px;
  font-weight: 700;
}

/* ─── Step states use status vars ─── */
.pur-step--done .pur-node {
  background: var(--accept-bg);
  border: 1.5px solid var(--accept-border);
  color: var(--accept);
}
.pur-step--done .pur-step-label {
  color: var(--accept);
}

.pur-step--active .pur-node {
  background: var(--accent-dim);
  border: 2px solid var(--accent);
  color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-dim);
}
.pur-step--active .pur-step-label {
  color: var(--accent);
  font-weight: 700;
}

.pur-step--pending .pur-node {
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-subtle);
  color: var(--text-muted);
}
.pur-step--pending .pur-step-label {
  color: var(--text-muted);
}

.pur-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulseDot 1.6s ease-in-out infinite;
}
@keyframes pulseDot {
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
.pur-arrow {
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  color: var(--border-subtle);
  min-width: 18px;
  justify-content: center;
}
.pur-arrow--done {
  color: var(--accept-border);
}

/* Body */
.pur-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}
.pur-body::-webkit-scrollbar {
  width: 4px;
}
.pur-body::-webkit-scrollbar-thumb {
  background: var(--accent-dim);
  border-radius: 4px;
}

.pur-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}

/* Meta */
.pur-meta {
  display: flex;
  gap: 20px;
  padding: 10px 0 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pur-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}
.pur-meta-item i {
  color: var(--accent);
}

/* Item block */
.pur-item {
  margin-bottom: 8px;
}
.pur-item-header {
  display: flex;
  align-items: center;
  padding: 10px 0 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-accent);
}
.pur-item-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: "Sora", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
}
.pur-item-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 24px 0;
}

/* Grid */
.pur-grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 0 20px;
}
.pur-divider {
  background: var(--border-subtle);
}
.pur-col {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.pur-col-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

/* Fields */
.pur-field {
  margin-bottom: 12px;
}
.pur-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.pur-field label {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.pur-view {
  min-height: 37px;
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  padding: 8px 11px;
}

/* Attachments */
.pur-attach-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.pur-attach-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  font-size: 12px;
  text-decoration: none;
  transition: all 0.18s;
}
.pur-attach-link:hover {
  background: var(--accent-bg);
}
.pur-no-attach {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

/* Lead time */
.pur-leadtime {
  margin-top: 8px;
  padding: 12px;
  border-radius: 10px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
}
.pur-leadtime label {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.pur-req {
  color: var(--resent);
  margin-left: 2px;
}
.pur-input {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  padding: 8px 11px;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.pur-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-dim);
}
.pur-hint {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

/* Footer */
.pur-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
  gap: 12px;
}
.pur-footer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pur-role-badge {
  font-size: 11.5px;
  font-weight: 600;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  padding: 3px 10px;
  border-radius: 6px;
}
.pur-footer-hint {
  font-size: 11px;
  color: var(--text-muted);
}
.pur-footer-actions {
  display: flex;
  gap: 8px;
}

.pur-btn {
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: all 0.18s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pur-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pur-btn--ghost {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.pur-btn--ghost:hover:not(:disabled) {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.pur-btn--outline {
  background: transparent;
  border: 1px solid var(--border-accent);
  color: var(--accent);
}
.pur-btn--outline:hover:not(:disabled) {
  background: var(--accent-dim);
}

.pur-btn--primary {
  padding: 9px 22px;
  font-family: "Sora", sans-serif;
  font-weight: 700;
  border: none;
  color: var(--text-primary-help);
  background: linear-gradient(135deg, var(--orb-1), var(--accent));
  box-shadow: 0 4px 14px var(--accent-glow);
}
.pur-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
</style>
