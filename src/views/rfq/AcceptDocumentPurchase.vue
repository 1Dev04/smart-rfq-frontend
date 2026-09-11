<script setup>
import { nextTick, ref, watch, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import RejectDocumentPurchase from "../../views/rfq/RejectDocumentPurchase.vue";
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_API_URL}`;
const auth = useAuthStore();

const isLoading = ref(false);
const isSubmitting = ref(false);
const doc = ref(null);
const leadTimes = ref({});
const showRejectModal = ref(false);
const isRejectedPending = computed(() => doc.value?.status === "reject");

const headerTitle = computed(() => {
  const raw = (doc.value?.status ?? doc.value?.Status ?? "") + "";
  const s = raw.toString().trim().toLowerCase();
  if (s === "reject") return "Reject Document";
  if (s === "cancel" || s === "cancelled" || s === "canceled")
    return "Cancelled Document";
  if (s === "user_pending" || s === "pending") return "Pending Document";
  if (s === "cost_saving") return "Cost Saving";
  return "Purchase Accept";
});


const isAlreadyAccepted = computed(() =>
  doc.value?.status === "waiting_quotation",
);
const isConfirmingWaiting = ref(false);

async function handleConfirmWaitingQuotation() {
  if (!doc.value?.items?.length) return;
  isConfirmingWaiting.value = true;
  try {
    const payload = {
      items: doc.value.items.map((item) => ({
        itemId: item.id,
        emails: [],
      })),
    };

    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/send-quotation-email`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.add({
        severity: "error",
        summary: "ดำเนินการไม่สำเร็จ",
        detail: body.message ?? `HTTP ${res.status}`,
        life: 6000,
      });
      return;
    }

    toast.add({
      severity: "success",
      summary: "สำเร็จ",
      detail: "เข้าสู่ขั้นตอน Waiting Quotation แล้ว",
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
    isConfirmingWaiting.value = false;
  }
}

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

function statusLabel(statusId) {
  return (
    allSteps.find((s) => s.id === statusId)?.label?.replace("\n", " ") ??
    statusId
  );
}

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

function onRejected(payload) {
  if (doc.value) {
    doc.value.status = payload.status;
    doc.value.revNo = payload.newRev ?? doc.value.revNo;
  }

  drawer.closeDrawer();
}

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

async function handleCancel() {
  if (!drawer.docRequestId) {
    drawer.closeDrawer();
    return;
  }

  const isOwner =
    auth.user?.email &&
    doc.value?.requesterEmail &&
    auth.user.email === doc.value.requesterEmail;
  if (!isOwner) {
    drawer.closeDrawer();
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({ reason: null }),
      },
    );

    if (res.status === 401) {
      toast.add({
        severity: "error",
        summary: "Session expired",
        detail: "Please log in again.",
        life: 5000,
      });
      return;
    }
    if (res.status === 403) {
      toast.add({
        severity: "error",
        summary: "ไม่มีสิทธิ์",
        detail: "คุณไม่มีสิทธิ์ยกเลิก RFQ นี้",
        life: 5000,
      });
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.add({
        severity: "error",
        summary: "Cancel failed",
        detail: body.message ?? `HTTP ${res.status}`,
        life: 6000,
      });
      return;
    }

    toast.add({
      severity: "success",
      summary: "Cancelled",
      detail: "RFQ ถูกยกเลิกเรียบร้อย",
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
                  <h2 class="pur-title">{{ headerTitle }}</h2>
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
                          stro-width="2"
                          stroke-linecap="round"
                        />
                      </svg>

                      <svg
                        v-else-if="stepStatus(step.id) === 'rejected'"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
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
                        <label>Duration Day </label>
                        <div class="pur-view">
                          {{ leadTimes[item.id] ?? "-" }}
                        </div>

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

            <div v-if="isRejectedPending" class="pending-user-banner">
              <i class="pi pi-hourglass"></i>
              <div>
                <strong>รอ Requester แก้ไขข้อมูล</strong>
                <p>RFQ นี้ถูกตีกลับไปแล้ว กำลังรอผู้ขอแก้ไขและส่งกลับมาใหม่</p>
                <p v-if="doc?.rejectReason" class="pending-reason">
                  เหตุผล: {{ doc.rejectReason }}
                </p>
              </div>
            </div>

            <div v-if="isAlreadyAccepted" class="pending-user-banner">
              <i class="pi pi-check-circle"></i>
              <div class="pending-banner-text">
                <strong>RFQ นี้ Accept ไปแล้ว</strong>
                <p>กดยืนยันเพื่อส่งต่อไปยังขั้นตอน Waiting Quotation</p>
              </div>
              <button
                class="pur-btn pur-btn--primary"
                :disabled="isConfirmingWaiting"
                @click="handleConfirmWaitingQuotation"
              >
                <i v-if="isConfirmingWaiting" class="pi pi-spin pi-spinner"></i>
                {{
                  isConfirmingWaiting
                    ? "กำลังส่ง..."
                    : "Confirm → Waiting Quotation"
                }}
              </button>
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
                  @click="handleCancel"
                >
                  Cancel
                </button>
                <button
                  class="pur-btn pur-btn--outline"
                  :disabled="
                    isSubmitting || isRejectedPending || isAlreadyAccepted
                  "
                  @click="showRejectModal = true"
                >
                  <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
                  Reject
                </button>
                <RejectDocumentPurchase
                  v-model="showRejectModal"
                  :doc-request-id="drawer.docRequestId"
                  :rfq-no="doc?.rfqNo"
                  @rejected="onRejected"
                />
                <button
                  class="pur-btn pur-btn--primary"
                  :disabled="
                    isSubmitting || isRejectedPending || isAlreadyAccepted
                  "
                  @click="handleAccept"
                >
                  <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
                  {{ isAlreadyAccepted ? "Accepted" : "Accept" }}
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

.pur-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
}

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

.pending-user-banner {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 24px;
  background: var(--accent-glow);
  border-bottom: 1px solid var(--accent-dim);
  color: var(--orb-3);
  font-size: 12.5px;
}
.pending-banner-text {
  flex: 1;
  min-width: 0;
}
.pending-user-banner strong {
  display: block;
  margin-bottom: 3px;
  color: var(--accept);
}
.pending-user-banner p {
  margin: 2px 0 0;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
}
.pending-reason {
  font-style: italic;
}

.pur-step--rejected .pur-node {
  background: var(--resent-bg);
  border: 2px solid var(--resent-border, #ef4444);
  color: var(--resent, #ef4444);
  box-shadow: 0 0 0 4px var(--resent-bg);
}
.pur-step--rejected .pur-step-label {
  color: var(--resent, #ef4444);
  font-weight: 700;
}

.pur-step--cancelled .pur-node {
  background: transparent;
  border: 1.5px dashed var(--border-subtle);
  color: var(--text-muted);
  opacity: 0.55;
}
.pur-step--cancelled .pur-step-label {
  color: var(--text-muted);
  opacity: 0.55;
}
</style>
