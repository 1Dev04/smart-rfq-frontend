<script setup>
import { nextTick, ref, watch, computed } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_LOCAL_BACKEND}`;

const isLoading = ref(false);
const doc = ref(null);
const showItems = ref(true);
const showFieldPanel = ref(false);

const LOGO_URL =
  "https://res.cloudinary.com/dxoiu2cn5/image/upload/v1782634393/image0_rjd86g.jpg";

const allSteps = [
  { id: "user_fill",         label: "User Fill\nData (Draft)" },
  { id: "purchase_accept",   label: "Purchase\nAccept" },
  { id: "waiting_quotation", label: "Waiting\nQuotation" },
  { id: "purchase_compare",  label: "Purchase\nCompare" },
  { id: "user_confirm",      label: "User\nConfirm" },
  { id: "purchase_confirm",  label: "Purchase\nConfirm" },
  { id: "finish",            label: "Finish" },
];

// ── Field definitions with preset (true = on by default) ─────────────────────
const FIELD_DEFS = [
  // group: Header
  { key: "rfqNo",              label: "RFQ No.",              group: "Header",   preset: true  },
  { key: "revNo",              label: "Rev. No.",             group: "Header",   preset: true  },
  { key: "createdAt",          label: "Req Date",             group: "Header",   preset: true  },
  { key: "requesterEmail",     label: "User / Engineer",      group: "Header",   preset: true  },
  { key: "purchaserEmail",     label: "Buyer (Purchase)",     group: "Header",   preset: false },
  // group: Item
  { key: "type",               label: "Item Type",            group: "Item",     preset: true  },
  { key: "itemDescription",    label: "Item Description",     group: "Item",     preset: true  },
  { key: "projectName",        label: "Project Name",         group: "Item",     preset: true  },
  { key: "specPurity",         label: "Spec / Purity",        group: "Item",     preset: false },
  { key: "specPartNo",         label: "Spec / Part No.",      group: "Item",     preset: false },
  { key: "glCode",             label: "GL Code",              group: "Item",     preset: false },
  { key: "sapItem",            label: "SAP Item No.",         group: "Item",     preset: false },
  { key: "model",              label: "Model",                group: "Item",     preset: true  },
  { key: "brand",              label: "Brand",                group: "Item",     preset: true  },
  { key: "forGas",             label: "For GAS",              group: "Item",     preset: false },
  // group: Spec
  { key: "cylinderType",       label: "Cylinder Type",        group: "Spec",     preset: false },
  { key: "cylinderSize",       label: "Cylinder Size (L)",    group: "Spec",     preset: false },
  { key: "quantity",           label: "Quantity / UOM",       group: "Spec",     preset: true  },
  { key: "makerSource",        label: "Maker / Source",       group: "Spec",     preset: false },
  { key: "requiredValve",      label: "Required Valve",       group: "Spec",     preset: false },
  { key: "purposeApplication", label: "Purpose / Application",group: "Spec",     preset: false },
  // group: Delivery
  { key: "leadTimeDays",       label: "Lead Time (วัน)",      group: "Delivery", preset: true  },
  { key: "targetPURreply",     label: "Target PUR Reply",     group: "Delivery", preset: true  },
  { key: "customer",           label: "Customer",             group: "Delivery", preset: false },
  { key: "addressLocation",    label: "Address / Location",   group: "Delivery", preset: false },
  { key: "recommendVendor",    label: "Recommend Vendor",     group: "Delivery", preset: true  },
];

const fieldGroups = ["Header", "Item", "Spec", "Delivery"];

// Reactive set of enabled field keys
const enabledFields = ref(new Set(FIELD_DEFS.filter(f => f.preset).map(f => f.key)));

function toggleField(key) {
  const s = new Set(enabledFields.value);
  s.has(key) ? s.delete(key) : s.add(key);
  enabledFields.value = s;
}

function isEnabled(key) {
  return enabledFields.value.has(key);
}

const enabledCount = computed(() => enabledFields.value.size);

function resetPreset() {
  enabledFields.value = new Set(FIELD_DEFS.filter(f => f.preset).map(f => f.key));
}

function enableAll() {
  enabledFields.value = new Set(FIELD_DEFS.map(f => f.key));
}

function disableAll() {
  enabledFields.value = new Set();
}

// Fields by group
function fieldsOfGroup(g) {
  return FIELD_DEFS.filter(f => f.group === g);
}

// ── Step pipeline ─────────────────────────────────────────────────────────────
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

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchDetail() {
  if (!drawer.docRequestId) return;
  isLoading.value = true;
  try {
    const res = await apiFetch(`${BASE}/api/doc-request/${drawer.docRequestId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    doc.value = await res.json();
  } catch (err) {
    toast.add({ severity: "error", summary: "โหลดข้อมูลไม่สำเร็จ", detail: err.message, life: 4000 });
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [drawer.docRequestId, drawer.showDrawer, drawer.drawerRole],
  async ([id, show, role]) => {
    await nextTick();
    if (id && show && role === "waiting") {
      doc.value = null;
      showItems.value = true;
      showFieldPanel.value = false;
      resetPreset();
      fetchDetail();
    }
  },
  { immediate: true }
);

// ── Print ─────────────────────────────────────────────────────────────────────
function handlePrint() { window.print(); }

// ── Helpers ───────────────────────────────────────────────────────────────────
function today() {
  return new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function attachLinks(item) {
  const links = [];
  if (item.attachDwgPath)       links.push({ label: "DWG",       href: item.attachDwgPath });
  if (item.attachSpecPath)      links.push({ label: "Spec",      href: item.attachSpecPath });
  if (item.attachQuotationPath) links.push({ label: "Quotation", href: item.attachQuotationPath });
  if (item.attachEtcPath)       links.push({ label: "ETC",       href: item.attachEtcPath });
  return links;
}

// ── Item field value resolver for dynamic display ─────────────────────────────
function fieldValue(item, key) {
  if (key === "quantity") return item.quantity != null ? `${item.quantity} ${item.uom ?? ""}`.trim() : "-";
  if (key === "leadTimeDays") return item.leadTimeDays != null ? `${item.leadTimeDays} วัน` : "-";
  return item[key] || "-";
}

// Header fields are doc-level (not per-item)
const HEADER_KEYS = ["rfqNo", "revNo", "createdAt", "requesterEmail", "purchaserEmail"];

// Item-level field defs (exclude header keys)
const itemFieldDefs = computed(() =>
  FIELD_DEFS.filter(f => !HEADER_KEYS.includes(f.key))
);

// Visible item fields
const visibleItemFields = computed(() =>
  itemFieldDefs.value.filter(f => enabledFields.value.has(f.key))
);
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="drawer.showDrawer && drawer.drawerRole === 'waiting'"
        class="ws-overlay"
        @click.self="drawer.closeDrawer()"
      >
        <Transition name="drawer-slide" appear>
          <div class="ws-panel" role="dialog" aria-modal="true">

            <!-- ══ SCREEN VIEW ══════════════════════════════════════════ -->
            <div class="ws-screen">

              <!-- Header -->
              <div class="ws-header">
                <div class="ws-header-left">
                  <div class="ws-badge">RFQ</div>
                  <div>
                    <h2 class="ws-title">Waiting Quotation</h2>
                    <span class="ws-sub">
                      {{ doc?.rfqNo }} · {{ doc?.revNo }} · {{ doc?.items?.length ?? 0 }} Items
                    </span>
                  </div>
                </div>
                <div class="ws-header-actions">
                  <!-- Choose Fields button -->
                  <button
                    class="ws-choose-btn"
                    :class="{ 'ws-choose-btn--active': showFieldPanel }"
                    @click="showFieldPanel = !showFieldPanel"
                    title="เลือก Field ที่จะแสดง"
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                    <span>Choose Fields</span>
                    <span class="ws-choose-badge">{{ enabledCount }}</span>
                  </button>
                  <!-- Show/Hide items -->
                  <button
                    class="ws-toggle"
                    @click="showItems = !showItems"
                    :title="showItems ? 'ซ่อน Items' : 'แสดง Items'"
                  >
                    <i :class="showItems ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                  </button>
                  <button class="ws-close" @click="drawer.closeDrawer()">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </div>

              <!-- ── Field Chooser Panel (slide down) ── -->
              <Transition name="field-panel">
                <div v-if="showFieldPanel" class="ws-field-panel">
                  <div class="ws-fp-header">
                    <span class="ws-fp-title">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                      เลือก Field ที่จะแสดงใน Items
                    </span>
                    <div class="ws-fp-actions">
                      <button class="ws-fp-action-btn" @click="enableAll">เปิดทั้งหมด</button>
                      <button class="ws-fp-action-btn" @click="disableAll">ปิดทั้งหมด</button>
                      <button class="ws-fp-action-btn ws-fp-action-btn--reset" @click="resetPreset">
                        <i class="pi pi-refresh"></i> Reset
                      </button>
                    </div>
                  </div>
                  <div class="ws-fp-body">
                    <div v-for="group in fieldGroups" :key="group" class="ws-fp-group">
                      <div class="ws-fp-group-label">{{ group }}</div>
                      <div class="ws-fp-chips">
                        <button
                          v-for="f in fieldsOfGroup(group)"
                          :key="f.key"
                          class="ws-fp-chip"
                          :class="{ 'ws-fp-chip--on': isEnabled(f.key) }"
                          @click="toggleField(f.key)"
                        >
                          <span class="ws-fp-chip-dot"></span>
                          {{ f.label }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>

              <!-- Pipeline -->
              <div class="ws-pipeline">
                <div class="ws-pipeline-track">
                  <template v-for="(step, i) in allSteps" :key="step.id">
                    <div class="ws-step" :class="`ws-step--${stepStatus(step.id)}`">
                      <div class="ws-node">
                        <svg v-if="stepStatus(step.id) === 'done'" width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span v-else-if="stepStatus(step.id) === 'active'" class="ws-pulse"/>
                        <span v-else class="ws-num">{{ i + 1 }}</span>
                      </div>
                      <span class="ws-step-label">{{ step.label }}</span>
                    </div>
                    <div v-if="i < allSteps.length - 1" class="ws-arrow"
                      :class="{ 'ws-arrow--done': stepStatus(step.id) === 'done' }">
                      <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
                        <path d="M1 6H14M10 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Body -->
              <div class="ws-body">
                <div v-if="isLoading" class="ws-loading">
                  <i class="pi pi-spin pi-spinner"></i> กำลังโหลด...
                </div>

                <template v-else-if="doc">
                  <!-- Meta -->
                  <div class="ws-meta">
                    <span v-if="isEnabled('requesterEmail')" class="ws-meta-item">
                      <i class="pi pi-user"></i> {{ doc.requesterEmail }}
                    </span>
                    <span v-if="isEnabled('createdAt')" class="ws-meta-item">
                      <i class="pi pi-calendar"></i> {{ doc.createdAt }}
                    </span>
                    <span v-if="doc.purchaserEmail && isEnabled('purchaserEmail')" class="ws-meta-item">
                      <i class="pi pi-briefcase"></i> {{ doc.purchaserEmail }}
                    </span>
                    <span class="ws-status-chip">⏳ Waiting Quotation</span>
                  </div>

                  <!-- Items -->
                  <Transition name="items-fade">
                    <div v-show="showItems" class="ws-items-wrapper">
                      <div v-for="(item, index) in doc.items" :key="item.id" class="ws-item">

                        <!-- Item header -->
                        <div class="ws-item-header">
                          <span class="ws-item-label">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                              <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>
                            </svg>
                            Item {{ String(index + 1).padStart(2, "0") }}
                          </span>
                          <span class="ws-item-type">{{ item.type }}</span>
                          <span class="ws-item-fields-count">
                            {{ visibleItemFields.length }} fields
                          </span>
                        </div>

                        <!-- Dynamic field grid -->
                        <div class="ws-summary-grid" v-if="visibleItemFields.length">
                          <div
                            v-for="f in visibleItemFields"
                            :key="f.key"
                            class="ws-kv"
                          >
                            <span>{{ f.label }}</span>
                            <strong>{{ fieldValue(item, f.key) }}</strong>
                          </div>
                        </div>

                        <div v-else class="ws-no-fields">
                          ไม่มี field ที่เลือก —
                          <button class="ws-no-fields-btn" @click="showFieldPanel = true">เปิด Choose Fields</button>
                        </div>

                        <!-- Attachments -->
                        <div v-if="attachLinks(item).length" class="ws-attach">
                          <span class="ws-attach-label">Attachments:</span>
                          <a v-for="f in attachLinks(item)" :key="f.label"
                            :href="f.href" target="_blank" class="ws-attach-chip">
                            <i class="pi pi-file"></i> {{ f.label }}
                          </a>
                        </div>

                        <div v-if="index < doc.items.length - 1" class="ws-item-divider"></div>
                      </div>
                    </div>
                  </Transition>

                  <!-- Collapsed hint -->
                  <div v-if="!showItems" class="ws-items-collapsed">
                    <i class="pi pi-list"></i>
                    <span>{{ doc.items.length }} Items ถูกซ่อนอยู่</span>
                    <button class="ws-items-collapsed-btn" @click="showItems = true">แสดง</button>
                  </div>
                </template>
              </div>

              <!-- Footer -->
              <div class="ws-footer">
                <div class="ws-footer-info">
                  <span class="ws-role-badge">⏳ Waiting Quotation</span>
                </div>
                <div class="ws-footer-actions">
                  <button class="ws-btn ws-btn--ghost" @click="drawer.closeDrawer()">Close</button>
                  <button class="ws-btn ws-btn--primary" @click="handlePrint">
                    <i class="pi pi-print"></i> Print Summary
                  </button>
                </div>
              </div>
            </div>

            <!-- ══ PRINT AREA ════════════════════════════════════════════ -->
            <div class="ws-print-area" v-if="doc">
              <div class="pdf-header">
                <div class="pdf-logo-block">
                  <img :src="LOGO_URL" alt="TJG Logo" class="pdf-logo"/>
                </div>
                <div class="pdf-title-block">
                  <div class="pdf-main-title">REQUEST FOR QUOTATION</div>
                  <div class="pdf-sub-title">Purchase Summary</div>
                </div>
                <div class="pdf-rfq-block">
                  <div class="pdf-rfq-no">{{ doc.rfqNo }}</div>
                  <div class="pdf-rfq-rev">{{ doc.revNo }}</div>
                </div>
              </div>

              <table class="pdf-meta-table">
                <tbody>
                  <tr>
                    <td class="pdf-mt-label">Date of Request</td>
                    <td class="pdf-mt-value">{{ doc.createdAt }}</td>
                    <td class="pdf-mt-label">Requester</td>
                    <td class="pdf-mt-value">{{ doc.requesterEmail }}</td>
                  </tr>
                  <tr>
                    <td class="pdf-mt-label">Date Printed</td>
                    <td class="pdf-mt-value">{{ today() }}</td>
                    <td class="pdf-mt-label">Buyer (Purchase)</td>
                    <td class="pdf-mt-value">{{ doc.purchaserEmail || "-" }}</td>
                  </tr>
                  <tr>
                    <td class="pdf-mt-label">Status</td>
                    <td class="pdf-mt-value pdf-status">Waiting Quotation</td>
                    <td class="pdf-mt-label">Total Items</td>
                    <td class="pdf-mt-value">{{ doc.items.length }} Item(s)</td>
                  </tr>
                </tbody>
              </table>

              <div v-for="(item, index) in doc.items" :key="item.id" class="pdf-item">
                <div class="pdf-item-no">
                  <span class="pdf-item-no-label">Item</span>
                  <span class="pdf-item-no-num">{{ String(index + 1).padStart(2, "0") }}</span>
                </div>
                <table class="pdf-detail-table">
                  <tbody>
                    <tr>
                      <td class="pdf-dl">Item Description</td>
                      <td class="pdf-dv">{{ item.itemDescription || "-" }}</td>
                      <td class="pdf-dl">Type</td>
                      <td class="pdf-dv">{{ item.type || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">Project Name</td>
                      <td class="pdf-dv">{{ item.projectName || "-" }}</td>
                      <td class="pdf-dl">Spec / Purity</td>
                      <td class="pdf-dv">{{ item.specPurity || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">GL Code</td>
                      <td class="pdf-dv">{{ item.glCode || "-" }}</td>
                      <td class="pdf-dl">Cylinder Type</td>
                      <td class="pdf-dv">{{ item.cylinderType || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">SAP Item No.</td>
                      <td class="pdf-dv">{{ item.sapItem || "-" }}</td>
                      <td class="pdf-dl">Cylinder Size (L)</td>
                      <td class="pdf-dv">{{ item.cylinderSize || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">Spec / Part No.</td>
                      <td class="pdf-dv">{{ item.specPartNo || "-" }}</td>
                      <td class="pdf-dl">Quantity / UOM</td>
                      <td class="pdf-dv pdf-bold">{{ item.quantity }} {{ item.uom }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">Model</td>
                      <td class="pdf-dv">{{ item.model || "-" }}</td>
                      <td class="pdf-dl">Maker / Source</td>
                      <td class="pdf-dv">{{ item.makerSource || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">Brand</td>
                      <td class="pdf-dv">{{ item.brand || "-" }}</td>
                      <td class="pdf-dl">Required Valve</td>
                      <td class="pdf-dv">{{ item.requiredValve || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">For GAS</td>
                      <td class="pdf-dv">{{ item.forGas || "-" }}</td>
                      <td class="pdf-dl">Purpose / Application</td>
                      <td class="pdf-dv">{{ item.purposeApplication || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">Target PUR Reply</td>
                      <td class="pdf-dv pdf-highlight">{{ item.targetPURreply || "-" }}</td>
                      <td class="pdf-dl">Customer</td>
                      <td class="pdf-dv">{{ item.customer || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">Lead Time (วัน)</td>
                      <td class="pdf-dv pdf-highlight pdf-bold">{{ item.leadTimeDays ?? "-" }}</td>
                      <td class="pdf-dl">Address / Location</td>
                      <td class="pdf-dv">{{ item.addressLocation || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">Recommend Vendor</td>
                      <td class="pdf-dv" colspan="3">{{ item.recommendVendor || "-" }}</td>
                    </tr>
                    <tr>
                      <td class="pdf-dl">Remark</td>
                      <td class="pdf-dv" colspan="3">{{ item.remark || "-" }}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="pdf-attach-row">
                  <span class="pdf-attach-title">Attachments:</span>
                  <template v-if="attachLinks(item).length">
                    <a v-for="f in attachLinks(item)" :key="f.label" :href="f.href" class="pdf-attach-tag">{{ f.label }}</a>
                  </template>
                  <span v-else class="pdf-no-attach">ไม่มีไฟล์แนบ</span>
                </div>
              </div>

              <div class="pdf-footer">
                <div class="pdf-footer-left">
                  <div class="pdf-sig-block">
                    <div class="pdf-sig-line"></div>
                    <div class="pdf-sig-label">Requester</div>
                    <div class="pdf-sig-email">{{ doc.requesterEmail }}</div>
                  </div>
                  <div class="pdf-sig-block">
                    <div class="pdf-sig-line"></div>
                    <div class="pdf-sig-label">Buyer (Purchase)</div>
                    <div class="pdf-sig-email">{{ doc.purchaserEmail || "-" }}</div>
                  </div>
                </div>
                <div class="pdf-footer-right">
                  <div class="pdf-footer-rfq">{{ doc.rfqNo }}</div>
                  <div class="pdf-footer-date">Printed: {{ today() }}</div>
                  <div class="pdf-footer-system">Smart RFQ System</div>
                </div>
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

/* ── Overlay / transitions ───────────────────────────────── */
.ws-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(0,0,0,.55); backdrop-filter: blur(5px);
}
.drawer-fade-enter-active { transition: opacity .25s ease; }
.drawer-fade-leave-active { transition: opacity .28s ease; }
.drawer-fade-enter-from,.drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active { animation: slideInRight .42s cubic-bezier(.16,1,.3,1) both; }
.drawer-slide-leave-active { animation: slideOutRight .28s cubic-bezier(.4,0,1,1) both; }
@keyframes slideInRight { from{transform:translateX(100%);opacity:.6} to{transform:translateX(0);opacity:1} }
@keyframes slideOutRight { from{transform:translateX(0);opacity:1} to{transform:translateX(100%);opacity:0} }

/* ── Panel ───────────────────────────────────────────────── */
.ws-panel {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 100%; height: 100dvh;
  display: flex; flex-direction: column;
  background: color-mix(in srgb, var(--bg-base) 84%, var(--orb-1) 16%);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -24px 0 80px rgba(0,0,0,.45);
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
}
.ws-screen {
  display: flex; flex-direction: column;
  height: 100%; min-height: 0; overflow: hidden;
}

/* ── Header ──────────────────────────────────────────────── */
.ws-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0; background: var(--bg-surface);
}
.ws-header-left { display: flex; align-items: center; gap: 12px; }
.ws-header-actions { display: flex; align-items: center; gap: 8px; }
.ws-badge {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--accent-dim); border: 1px solid var(--accent-glow);
  color: var(--accent); display: flex; align-items: center; justify-content: center;
  font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 700;
}
.ws-title { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px; }
.ws-sub { font-size: 11.5px; color: var(--text-muted); }

/* ── Choose Fields button ────────────────────────────────── */
.ws-choose-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 14px; border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all .18s; white-space: nowrap;
}
.ws-choose-btn:hover,
.ws-choose-btn--active {
  background: var(--accent-dim);
  border-color: var(--accent-glow);
  color: var(--accent);
}
.ws-choose-badge {
  min-width: 18px; height: 18px; padding: 0 5px;
  background: var(--accent); color: var(--text-primary-help);
  border-radius: 999px; font-size: 10px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
}
.ws-choose-btn--active .ws-choose-badge {
  background: var(--accent);
}

/* ── Toggle / Close ──────────────────────────────────────── */
.ws-toggle {
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  color: var(--text-secondary); display: flex; align-items: center;
  justify-content: center; cursor: pointer; transition: all .18s;
  font-size: 13px;
}
.ws-toggle:hover { background: var(--accent-dim); border-color: var(--accent-glow); color: var(--accent); }
.ws-close {
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  color: var(--text-secondary); display: flex; align-items: center;
  justify-content: center; cursor: pointer; transition: background .2s, color .2s;
}
.ws-close:hover { background: var(--resent-bg); color: var(--resent); border-color: var(--resent-border); }

/* ── Field Panel (slide down from header) ────────────────── */
.field-panel-enter-active {
  animation: fpSlideDown .32s cubic-bezier(.16,1,.3,1) both;
}
.field-panel-leave-active {
  animation: fpSlideUp .22s cubic-bezier(.4,0,1,1) both;
}
@keyframes fpSlideDown {
  from { transform: translateY(-12px); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
@keyframes fpSlideUp {
  from { transform: translateY(0);     opacity: 1; }
  to   { transform: translateY(-12px); opacity: 0; }
}

.ws-field-panel {
  flex-shrink: 0;
  background: var(--bg-surface);
  border-bottom: 2px solid var(--accent-glow);
  box-shadow: 0 8px 24px rgba(0,0,0,.25);
  z-index: 10;
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}
.ws-fp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px 10px;
  border-bottom: 1px solid var(--border-subtle);
  gap: 12px; flex-wrap: wrap;
}
.ws-fp-title {
  display: flex; align-items: center; gap: 7px;
  font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 700;
  color: var(--accent);
}
.ws-fp-actions { display: flex; gap: 6px; }
.ws-fp-action-btn {
  padding: 5px 12px; border-radius: 6px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  color: var(--text-secondary); font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s;
  display: flex; align-items: center; gap: 4px;
}
.ws-fp-action-btn:hover { background: var(--accent-dim); border-color: var(--accent-glow); color: var(--accent); }
.ws-fp-action-btn--reset { color: var(--accent); border-color: var(--accent-glow); background: var(--accent-dim); }

.ws-fp-body { padding: 12px 24px 16px; display: flex; flex-direction: column; gap: 12px; }
.ws-fp-group { display: flex; flex-direction: column; gap: 6px; }
.ws-fp-group-label {
  font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-muted); padding-bottom: 2px; border-bottom: 1px solid var(--border-subtle);
}
.ws-fp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ws-fp-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 999px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  color: var(--text-muted); font-size: 11.5px; font-weight: 500;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all .15s; white-space: nowrap;
}
.ws-fp-chip:hover { border-color: var(--accent-glow); color: var(--text-secondary); }
.ws-fp-chip--on {
  background: var(--accent-dim); border-color: var(--accent-glow);
  color: var(--accent); font-weight: 600;
}
.ws-fp-chip-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  background: var(--border-subtle); transition: background .15s;
}
.ws-fp-chip--on .ws-fp-chip-dot { background: var(--accent); }

/* ── Pipeline ────────────────────────────────────────────── */
.ws-pipeline {
  padding: 14px 24px; border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0; background: var(--bg-surface); overflow-x: auto;
}
.ws-pipeline-track { display: flex; align-items: center; min-width: max-content; }
.ws-step { display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 76px; }
.ws-node {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0; transition: all .3s;
}
.ws-step-label { font-size: 9.5px; font-weight: 500; text-align: center; line-height: 1.3; white-space: pre-line; }
.ws-num { font-size: 11px; font-weight: 700; }
.ws-step--done .ws-node { background: var(--accept-bg); border: 1.5px solid var(--accept-border); color: var(--accept); }
.ws-step--done .ws-step-label { color: var(--accept); }
.ws-step--active .ws-node { background: var(--accent-dim); border: 2px solid var(--accent); color: var(--accent); box-shadow: 0 0 0 4px var(--accent-dim); }
.ws-step--active .ws-step-label { color: var(--accent); font-weight: 700; }
.ws-step--pending .ws-node { background: var(--bg-elevated); border: 1.5px solid var(--border-subtle); color: var(--text-muted); }
.ws-step--pending .ws-step-label { color: var(--text-muted); }
.ws-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulseDot 1.6s ease-in-out infinite; }
@keyframes pulseDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.7} }
.ws-arrow { flex: 1; display: flex; align-items: flex-start; padding-top: 6px; color: var(--border-subtle); min-width: 18px; justify-content: center; }
.ws-arrow--done { color: var(--accept-border); }

/* ── Body ────────────────────────────────────────────────── */
.ws-body {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 20px 24px;
  scrollbar-width: thin; scrollbar-color: var(--accent-dim) transparent;
}
.ws-loading { display: flex; align-items: center; gap: 10px; justify-content: center; padding: 60px 0; color: var(--text-muted); }

.ws-meta {
  display: flex; gap: 16px; padding: 10px 0 16px;
  border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px;
  flex-wrap: wrap; align-items: center;
}
.ws-meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
.ws-meta-item i { color: var(--accent); }
.ws-status-chip {
  margin-left: auto; font-size: 11px; font-weight: 700;
  background: var(--waiting-bg, rgba(245,158,11,.22));
  color: var(--waiting, #fde68a);
  border: 1px solid var(--waiting-border, rgba(251,191,36,.45));
  border-radius: 999px; padding: 3px 12px;
}

/* ── Items ───────────────────────────────────────────────── */
.items-fade-enter-active { transition: opacity .22s ease, transform .22s ease; }
.items-fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.items-fade-enter-from { opacity: 0; transform: translateY(-6px); }
.items-fade-leave-to   { opacity: 0; transform: translateY(-6px); }

.ws-item { margin-bottom: 8px; }
.ws-item-header {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0 12px; margin-bottom: 14px;
  border-bottom: 1px solid var(--border-accent);
}
.ws-item-label {
  display: flex; align-items: center; gap: 7px;
  font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700; color: var(--accent);
}
.ws-item-type {
  margin-left: auto; font-size: 11px; font-weight: 600;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  color: var(--text-secondary); border-radius: 6px; padding: 3px 10px;
}
.ws-item-fields-count {
  font-size: 10px; color: var(--text-muted);
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 6px; padding: 3px 8px;
}
.ws-item-divider { height: 1px; background: var(--border-subtle); margin: 20px 0; }

.ws-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.ws-kv {
  display: flex; flex-direction: column; gap: 3px;
  background: var(--bg-elevated); border: 1px solid var(--border-subtle);
  border-radius: 8px; padding: 9px 12px;
}
.ws-kv span { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
.ws-kv strong { font-size: 13px; color: var(--text-primary); font-weight: 500; }

.ws-no-fields {
  padding: 16px; text-align: center; font-size: 12px; color: var(--text-muted);
  background: var(--bg-elevated); border: 1px dashed var(--border-subtle);
  border-radius: 8px; margin-bottom: 12px;
}
.ws-no-fields-btn {
  background: none; border: none; color: var(--accent); font-weight: 600;
  font-size: 12px; cursor: pointer; text-decoration: underline;
}

.ws-attach { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.ws-attach-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
.ws-attach-chip {
  display: flex; align-items: center; gap: 5px; padding: 5px 10px;
  border-radius: 7px; background: var(--accent-dim); border: 1px solid var(--accent-glow);
  color: var(--accent); font-size: 11px; text-decoration: none;
}

.ws-items-collapsed {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  border-radius: 10px; background: var(--bg-elevated);
  border: 1px dashed var(--border-subtle); color: var(--text-muted); font-size: 13px;
}
.ws-items-collapsed .pi { color: var(--accent); }
.ws-items-collapsed-btn {
  margin-left: auto; padding: 5px 14px; border-radius: 7px;
  background: var(--accent-dim); border: 1px solid var(--accent-glow);
  color: var(--accent); font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
}

/* ── Footer ──────────────────────────────────────────────── */
.ws-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px; border-top: 1px solid var(--border-subtle);
  flex-shrink: 0; background: var(--bg-surface);
}
.ws-footer-info { display: flex; align-items: center; }
.ws-role-badge {
  font-size: 11.5px; font-weight: 600;
  background: var(--waiting-bg, rgba(245,158,11,.22));
  border: 1px solid var(--waiting-border, rgba(251,191,36,.45));
  color: var(--waiting, #fde68a); padding: 3px 10px; border-radius: 6px;
}
.ws-footer-actions { display: flex; gap: 8px; }
.ws-btn {
  padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .18s;
  display: flex; align-items: center; gap: 6px;
}
.ws-btn:disabled { opacity: .4; cursor: not-allowed; }
.ws-btn--ghost { background: transparent; border: 1px solid var(--border-subtle); color: var(--text-secondary); }
.ws-btn--ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }
.ws-btn--primary {
  padding: 9px 22px; font-family: 'Sora', sans-serif; font-weight: 700;
  border: none; color: var(--text-primary-help);
  background: linear-gradient(135deg, var(--orb-1), var(--accent));
  box-shadow: 0 4px 14px var(--accent-glow);
}
.ws-btn--primary:hover { transform: translateY(-1px); box-shadow: var(--shadow); }

/* ── Hide print area on screen ───────────────────────────── */
.ws-print-area { display: none; }

/* ══════════════════════════════════════════════════════════
   PRINT STYLES
══════════════════════════════════════════════════════════ */
@media print {
  .ws-screen { display: none !important; }
  .ws-print-area { display: block !important; }
  :global(body) { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  :global(*) { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: A4 portrait; margin: 14mm 14mm 16mm 14mm; }

  .pdf-header { display: flex; align-items: center; gap: 0; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 10px; }
  .pdf-logo-block { width: 80px; flex-shrink: 0; }
  .pdf-logo { width: 72px; height: auto; object-fit: contain; }
  .pdf-title-block { flex: 1; padding-left: 14px; border-left: 2px solid #e2e8f0; margin-left: 10px; }
  .pdf-main-title { font-family: 'Sora', sans-serif; font-size: 18pt; font-weight: 700; color: #1e3a5f; line-height: 1.1; }
  .pdf-sub-title { font-size: 9pt; color: #64748b; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; margin-top: 3px; }
  .pdf-rfq-block { text-align: right; flex-shrink: 0; }
  .pdf-rfq-no { font-family: 'Sora', sans-serif; font-size: 13pt; font-weight: 700; color: #1e3a5f; }
  .pdf-rfq-rev { font-size: 8pt; color: #94a3b8; margin-top: 2px; }

  .pdf-meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8.5pt; }
  .pdf-meta-table td { padding: 5px 9px; border: 1px solid #e2e8f0; }
  .pdf-mt-label { background: #f1f5f9; font-weight: 700; color: #334155; width: 18%; white-space: nowrap; }
  .pdf-mt-value { color: #1e293b; width: 32%; }
  .pdf-status { color: #b45309; font-weight: 700; }

  .pdf-item { margin-bottom: 14px; page-break-inside: avoid; }
  .pdf-item-no { display: flex; align-items: baseline; gap: 6px; background: #1e3a5f; color: #fff; padding: 5px 12px; border-radius: 4px 4px 0 0; font-family: 'Sora', sans-serif; }
  .pdf-item-no-label { font-size: 7.5pt; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; opacity: .8; }
  .pdf-item-no-num { font-size: 13pt; font-weight: 700; }

  .pdf-detail-table { width: 100%; border-collapse: collapse; font-size: 8pt; border: 1px solid #cbd5e1; }
  .pdf-detail-table td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
  .pdf-dl { background: #f8fafc; font-weight: 700; color: #475569; width: 15%; white-space: nowrap; }
  .pdf-dv { color: #1e293b; width: 35%; }
  .pdf-bold { font-weight: 700; }
  .pdf-highlight { background: #fef9c3; font-weight: 700; color: #92400e; }

  .pdf-attach-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; font-size: 8pt; }
  .pdf-attach-title { font-weight: 700; color: #475569; }
  .pdf-attach-tag { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 3px; padding: 1px 7px; font-size: 7.5pt; font-weight: 600; text-decoration: none; }
  .pdf-no-attach { color: #94a3b8; font-style: italic; }

  .pdf-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 12px; border-top: 2px solid #e2e8f0; }
  .pdf-footer-left { display: flex; gap: 48px; }
  .pdf-sig-block { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
  .pdf-sig-line { height: 1px; background: #334155; margin-bottom: 4px; }
  .pdf-sig-label { font-size: 8pt; font-weight: 700; color: #334155; }
  .pdf-sig-email { font-size: 7.5pt; color: #64748b; }
  .pdf-footer-right { text-align: right; }
  .pdf-footer-rfq { font-family: 'Sora', sans-serif; font-size: 10pt; font-weight: 700; color: #1e3a5f; }
  .pdf-footer-date { font-size: 7.5pt; color: #64748b; margin-top: 2px; }
  .pdf-footer-system { font-size: 7pt; color: #94a3b8; margin-top: 1px; }
}
</style>