<script setup>
import { ref, watch, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_LOCAL_BACKEND}`;

const isLoading = ref(false);
const doc = ref(null);

const allSteps = [
  { id: "user_fill", label: "User Fill\nData (Draft)" },
  { id: "purchase_accept", label: "Purchase\nAccept" },
  { id: "waiting_quote", label: "Waiting\nQuotation" },
  { id: "purchase_compare", label: "Purchase\nCompare" },
  { id: "user_confirm", label: "User\nConfirm" },
  { id: "purchase_confirm", label: "Purchase\nConfirm" },
  { id: "finish", label: "Finish" },
];

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

async function fetchDetail() {
  if (!drawer.docRequestId) return;
  isLoading.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    doc.value = await res.json();
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

function statusLabel(statusId) {
  return (
    allSteps.find((s) => s.id === statusId)?.label?.replace("\n", " ") ??
    statusId
  );
}

watch(
  () => [drawer.docRequestId, drawer.showDrawer, drawer.drawerRole],
  async ([id, show, role]) => {
    await nextTick();
    if (id && show && role === "user") {
      doc.value = null;
      fetchDetail();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="uv-fade">
      <div
        v-if="
          drawer.showDrawer &&
          drawer.drawerRole === 'user' &&
          drawer.docRequestId
        "
        class="uv-overlay"
        @click.self="drawer.closeDrawer()"
      >
        <Transition name="uv-slide" appear>
          <div class="uv-panel" role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="uv-header">
              <div class="uv-header-left">
                <div class="uv-badge">RFQ</div>
                <div>
                  <h2 class="uv-title">View Request</h2>
                  <span class="uv-sub">
                    {{ doc?.rfqNo }} · {{ doc?.revNo }} ·
                    {{ doc?.items?.length ?? 0 }} Items
                  </span>
                </div>
              </div>
              <button class="uv-close" @click="drawer.closeDrawer()">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Pipeline -->
            <div class="uv-pipeline">
              <div class="uv-pipeline-track">
                <template v-for="(step, i) in allSteps" :key="step.id">
                  <div
                    class="uv-step"
                    :class="`uv-step--${stepStatus(step.id)}`"
                  >
                    <div class="uv-node">
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
                        class="uv-pulse"
                      />
                      <span v-else class="uv-num">{{ i + 1 }}</span>
                    </div>
                    <span class="uv-step-label">{{ step.label }}</span>
                  </div>
                  <div
                    v-if="i < allSteps.length - 1"
                    class="uv-arrow"
                    :class="{
                      'uv-arrow--done': stepStatus(step.id) === 'done',
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
            <div class="uv-body">
              <div v-if="isLoading" class="uv-loading">
                <i class="pi pi-spin pi-spinner"></i> กำลังโหลด...
              </div>

              <template v-else-if="doc">
                <!-- Meta -->
                <div class="uv-meta">
                  <span class="uv-meta-item"
                    ><i class="pi pi-user"></i> {{ doc.requesterEmail }}</span
                  >
                  <span class="uv-meta-item"
                    ><i class="pi pi-calendar"></i> {{ doc.createdAt }}</span
                  >
                  <span v-if="doc.purchaserEmail" class="uv-meta-item"
                    ><i class="pi pi-briefcase"></i>
                    {{ doc.purchaserEmail }}</span
                  >
                </div>

                <!-- Items read-only -->
                <div
                  v-for="(item, index) in doc.items"
                  :key="item.id"
                  class="uv-item"
                >
                  <div class="uv-item-header">
                    <span class="uv-item-label">
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

                  <div class="uv-grid">
                    <!-- Left -->
                    <div class="uv-col">
                      <div class="uv-col-title">General Info</div>
                      <div class="uv-row">
                        <div class="uv-field">
                          <label>Target PUR Reply</label>
                          <div class="uv-view">
                            {{ item.targetPURreply ?? "-" }}
                          </div>
                        </div>
                        <div class="uv-field">
                          <label>GL Code</label>
                          <div class="uv-view">{{ item.glCode ?? "-" }}</div>
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>Project Name</label>
                        <div class="uv-view">{{ item.projectName ?? "-" }}</div>
                      </div>
                      <div class="uv-field">
                        <label>SAP Item No.</label>
                        <div class="uv-view">{{ item.sapItem ?? "-" }}</div>
                      </div>
                      <div class="uv-field">
                        <label>Item Description</label>
                        <div class="uv-view">
                          {{ item.itemDescription ?? "-" }}
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>Specification / Part No.</label>
                        <div class="uv-view">{{ item.specPartNo ?? "-" }}</div>
                      </div>
                      <div class="uv-row">
                        <div class="uv-field">
                          <label>Model</label>
                          <div class="uv-view">{{ item.model ?? "-" }}</div>
                        </div>
                        <div class="uv-field">
                          <label>Brand</label>
                          <div class="uv-view">{{ item.brand ?? "-" }}</div>
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>For GAS</label>
                        <div class="uv-view">{{ item.forGas ?? "-" }}</div>
                      </div>
                      <div class="uv-field">
                        <label>Attachments</label>
                        <div class="uv-attach-list">
                          <a
                            v-if="item.attachDwgPath"
                            :href="item.attachDwgPath"
                            target="_blank"
                            class="uv-attach-link"
                          >
                            <i class="pi pi-file"></i> DWG
                          </a>
                          <a
                            v-if="item.attachSpecPath"
                            :href="item.attachSpecPath"
                            target="_blank"
                            class="uv-attach-link"
                          >
                            <i class="pi pi-file"></i> Spec
                          </a>
                          <a
                            v-if="item.attachQuotationPath"
                            :href="item.attachQuotationPath"
                            target="_blank"
                            class="uv-attach-link"
                          >
                            <i class="pi pi-file"></i> Quotation
                          </a>
                          <a
                            v-if="item.attachEtcPath"
                            :href="item.attachEtcPath"
                            target="_blank"
                            class="uv-attach-link"
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
                            class="uv-no-attach"
                            >ไม่มีไฟล์แนบ</span
                          >
                          
                        </div>
                      </div>
                    </div>

                    <div class="uv-divider"></div>

                    <!-- Right -->
                    <div class="uv-col">
                      <div class="uv-col-title">Product Specification</div>
                      <div class="uv-row">
                        <div class="uv-field">
                          <label>Type</label>
                          <div class="uv-view">{{ item.type ?? "-" }}</div>
                        </div>
                        <div class="uv-field">
                          <label>Spec / Purity</label>
                          <div class="uv-view">
                            {{ item.specPurity ?? "-" }}
                          </div>
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>Cylinder Type</label>
                        <div class="uv-view">
                          {{ item.cylinderType ?? "-" }}
                        </div>
                      </div>
                      <div class="uv-row">
                        <div class="uv-field">
                          <label>Quantity</label>
                          <div class="uv-view">{{ item.quantity ?? "-" }}</div>
                        </div>
                        <div class="uv-field">
                          <label>UOM</label>
                          <div class="uv-view">{{ item.uom ?? "-" }}</div>
                        </div>
                      </div>
                      <div class="uv-row">
                        <div class="uv-field">
                          <label>Cylinder Size (L)</label>
                          <div class="uv-view">
                            {{ item.cylinderSize ?? "-" }}
                          </div>
                        </div>
                        <div class="uv-field">
                          <label>Maker / Source</label>
                          <div class="uv-view">
                            {{ item.makerSource ?? "-" }}
                          </div>
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>Required Type Valve</label>
                        <div class="uv-view">
                          {{ item.requiredValve ?? "-" }}
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>Purpose / Application</label>
                        <div class="uv-view">
                          {{ item.purposeApplication ?? "-" }}
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>Customer</label>
                        <div class="uv-view">{{ item.customer ?? "-" }}</div>
                      </div>
                      <div class="uv-field">
                        <label>Address / Location</label>
                        <div class="uv-view">
                          {{ item.addressLocation ?? "-" }}
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>Recommend Vendor / Brand</label>
                        <div class="uv-view">
                          {{ item.recommendVendor ?? "-" }}
                        </div>
                      </div>
                      <div class="uv-field">
                        <label>Remark</label>
                        <div class="uv-view">{{ item.remark ?? "-" }}</div>
                      </div>

                      <!-- Lead Time read-only -->
                      <div v-if="item.leadTimeDays" class="uv-leadtime">
                        <label>Lead Time (วัน)</label>
                        <div class="uv-view">{{ item.leadTimeDays }} วัน</div>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="index < doc.items.length - 1"
                    class="uv-item-divider"
                  ></div>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="uv-footer">
              <div class="uv-footer-info">
                <span class="uv-role-badge">👤 User (View Only)</span>
                <span class="uv-footer-hint"
                  >{{ doc?.items?.length ?? 0 }} Items ·
                  {{ statusLabel(doc?.status) }}</span
                >
              </div>
              <div class="uv-footer-actions">
                <button class="uv-btn" @click="drawer.closeDrawer()">
                  Close
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

.uv-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
}

.uv-fade-enter-active {
  transition: opacity 0.25s ease;
}
.uv-fade-leave-active {
  transition: opacity 0.28s ease;
}
.uv-fade-enter-from,
.uv-fade-leave-to {
  opacity: 0;
}

.uv-slide-enter-active {
  animation: uvSlideIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.uv-slide-leave-active {
  animation: uvSlideOut 0.28s cubic-bezier(0.4, 0, 1, 1) both;
}
@keyframes uvSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes uvSlideOut {
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
.uv-panel {
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
.uv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
}
.uv-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.uv-badge {
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
.uv-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px;
}
.uv-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}
.uv-close {
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
.uv-close:hover {
  background: var(--resent-bg);
  color: var(--resent);
  border-color: var(--resent-border);
}

/* Pipeline */
.uv-pipeline {
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
  overflow-x: auto;
}
.uv-pipeline-track {
  display: flex;
  align-items: center;
  min-width: max-content;
}
.uv-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 76px;
}
.uv-node {
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
.uv-step-label {
  font-size: 9.5px;
  font-weight: 500;
  text-align: center;
  line-height: 1.3;
  white-space: pre-line;
}
.uv-num {
  font-size: 11px;
  font-weight: 700;
}

.uv-step--done .uv-node {
  background: var(--accept-bg);
  border: 1.5px solid var(--accept-border);
  color: var(--accept);
}
.uv-step--done .uv-step-label {
  color: var(--accept);
}
.uv-step--active .uv-node {
  background: var(--accent-dim);
  border: 2px solid var(--accent);
  color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-dim);
}
.uv-step--active .uv-step-label {
  color: var(--accent);
  font-weight: 700;
}
.uv-step--pending .uv-node {
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-subtle);
  color: var(--text-muted);
}
.uv-step--pending .uv-step-label {
  color: var(--text-muted);
}

.uv-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: uvPulse 1.6s ease-in-out infinite;
}
@keyframes uvPulse {
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
.uv-arrow {
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  color: var(--border-subtle);
  min-width: 18px;
  justify-content: center;
}
.uv-arrow--done {
  color: var(--accept-border);
}

/* Body */
.uv-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}
.uv-body::-webkit-scrollbar {
  width: 4px;
}
.uv-body::-webkit-scrollbar-thumb {
  background: var(--accent-dim);
  border-radius: 4px;
}
.uv-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}

/* Meta */
.uv-meta {
  display: flex;
  gap: 20px;
  padding: 10px 0 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.uv-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}
.uv-meta-item i {
  color: var(--accent);
}
.uv-status-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
}

/* Item */
.uv-item {
  margin-bottom: 8px;
}
.uv-item-header {
  display: flex;
  align-items: center;
  padding: 10px 0 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-accent);
}
.uv-item-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: "Sora", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
}
.uv-item-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 24px 0;
}

/* Grid */
.uv-grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 0 20px;
}
.uv-divider {
  background: var(--border-subtle);
}
.uv-col {
  display: flex;
  flex-direction: column;
}
.uv-col-title {
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
.uv-field {
  margin-bottom: 12px;
}
.uv-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.uv-field label {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.uv-view {
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
.uv-attach-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.uv-attach-link {
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
.uv-attach-link:hover {
  background: var(--accent-bg);
}
.uv-no-attach {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

/* Lead time */
.uv-leadtime {
  margin-top: 8px;
  padding: 12px;
  border-radius: 10px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
}
.uv-leadtime label {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Footer */
.uv-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
  gap: 12px;
}
.uv-footer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.uv-role-badge {
  font-size: 11.5px;
  font-weight: 600;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  padding: 3px 10px;
  border-radius: 6px;
}
.uv-footer-hint {
  font-size: 11px;
  color: var(--text-muted);
}
.uv-footer-actions {
  display: flex;
  gap: 8px;
}
.uv-btn {
  padding: 9px 22px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  transition: all 0.18s;
}
.uv-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
</style>
