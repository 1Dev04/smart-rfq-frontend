<script setup>
import { ref, computed } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import DatePicker from 'primevue/datepicker'
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast        = useToast();
const isSubmitting = ref(false);
const category     = computed(() => drawer.category)  

const categoryTypeMap = {
  "project-revenue": "Project Revenue (I/O)",
  lpg: "LPG 5Years & Yearly Insp",
  calibration: "Calibration Gas Detector",
  "project-expense": "Project Expense (I/O)",
  "trading-cylinder": "Trading Gas Cylinder, Trading other",
  "trading-bulk": "Trading Gas Bulk",
  "fix-asset-cylinder": "Fix Asset Gas Cylinder",
  expense: "Expense",
  "spare-parts": "Spare parts & Equipment For Gas",
  "fix-asset": "Fix Asset",
};


const prefilledType = computed(() =>
  category.value ? (categoryTypeMap[category.value.id] ?? "") : "",
);

const isTypeLocked = computed(() => !!prefilledType.value);

import { watch } from "vue";
watch(prefilledType, (val) => {
  if (val && items.value.length > 0) {
    items.value[0].type = val;
  }
}, { immediate: true });

const allSteps = [
  { id: "user_fill", label: "User Fill\nData", role: "user" },
  { id: "purchase_accept", label: "Purchase\nAccept", role: "purchase" },
  { id: "waiting_quote", label: "Waiting\nQuotation", role: "purchase" },
  { id: "purchase_compare", label: "Purchase\nCompare", role: "purchase" },
  { id: "user_confirm", label: "User\nConfirm", role: "user" },
  { id: "purchase_confirm", label: "Purchase\nConfirm", role: "purchase" },
  { id: "finish", label: "Finish", role: "all" },
];

const activeStepIndex = computed(() => {
  if (drawer.drawerRole === "user") return 0;
  if (drawer.drawerRole === "purchase") return 1;
  return allSteps.length - 1;
});

function stepStatus(index) {
  if (index < activeStepIndex.value) return "done";
  if (index === activeStepIndex.value) return "active";
  return "pending";
}

const createEmptyItem = () => ({
  projectName: "",
  glCode: "",
  sapItemNo: "new",
  sapItemNoText: "",
  itemDescription: "",
  specPartNo: "",
  model: "",
  brand: "",
  forGas: "",
  attachDWG: null,
  attachSpec: null,
  attachQuotation: null,
  attachEtc: null,
  targetPURreply: "",
  type: "",
  specPurity: "",
  cylinderType: "",
  quantity: "",
  uom: "",
  cylinderSize: "",
  makerSource: "",
  requiredValve: "",
  purposeApplication: "",
  customer: "",
  addressLocation: "",
  recommendVendor: "",
  remark: "",
});

const items = ref([createEmptyItem()]);

function addItem() {
  if (items.value.length < 50) {
    items.value.push(createEmptyItem());
  }
}

function removeItem(index) {
  if (items.value.length > 1) {
    items.value.splice(index, 1);
  }
}

const typeOptions = [
  "Project Revenue (I/O)",
  "LPG 5Years & Yearly Insp",
  "Calibration Gas Detector",
  "Project Expense (I/O)",
  "Trading Gas Cylinder, Trading other",
  "Trading Gas Bulk",
  "Fix Asset Gas Cylinder",
  "Expense",
  "Spare parts & Equipment For Gas",
  "Fix Asset",
];
const glCodeOptions = ["GL-1001", "GL-1002", "GL-2001", "GL-3001", "GL-4001"];

const footerActions = computed(() => {
  if (drawer.drawerRole === "user")
    return [
      { label: "Save Draft", style: "ghost", action: "draft" },
      { label: "Add Items", style: "outline", action: "add" },
      { label: "Send Request", style: "primary", action: "send" },
    ];
  if (drawer.drawerRole === "purchase")
    return [
      { label: "Cancel", style: "ghost", action: "cancel" },
      { label: "Reject", style: "outline", action: "reject" },
      { label: "Accept", style: "primary", action: "accept" },
    ];
  return [];
});

async function handleAction(action) {
  // Validate

  if (action === "cancel" || action === "draft") {
    drawer.closeDrawer();
    return;
  }
  if (action === "add") {
    addItem();
     toast.add({
      severity: "info",
      summary:  "Item added",
      detail:   `Item ${items.value.length} added. (${items.value.length}/50)`,
      closable: true,
      life:     2500,
    });
    return;
  }

  if (action === "reject"){
    isSubmitting.value = true;
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL_BACKEND}/api/doc-request/reject`, {
        method: "POST",
        body:   JSON.stringify({ items: items.value }),
      });

      if (res.status === 401) {
        toast.add({
        severity: "error",
        summary:  "Session expired",
        detail:   "Please log in again.",
        closable: true,
        life:     5000,
      });
      router.push("/login"); 
      return;
      }

      if(!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.add({
          severity: "error",
          summary: "Reject failed",
          detail: body.message ?? `Server error (HTTP ${res.status})`,
          closable: true,
          life: 6000,
        });
        return;
      }
      toast.add({
        severity: "warn",
        summary: "Request rejected",
        detail: "The RFQ has been rejected and returned to the requester.",
        closable: true,
        life: 4000,
      });
      drawer.closeDrawer();

    } catch (err) {
      toast.add({
        severity: "error",
        summary: "Network error",
        detail: err.message,
        closable: true,
        life: 6000,
      })
    } finally {
      isSubmitting.value = false;
    }
    return;
  }
  // Send Request (User) / Accept (Purchase)
  if (action === "send" || action === "accept") {
    const endpoint = action === "send"
    ? `${import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL_BACKEND}/api/doc-request/create"` 
    : `${import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL_BACKEND}/api/doc-request/accept`;

    const successMsg = action === "send"
    ? { summary: "Request sent",    detail: "Your RFQ has been submitted to Purchase." }
    : { summary: "Request accepted", detail: "RFQ accepted and moved to next step." };
     isSubmitting.value = true;

     try {
        const res = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body:    JSON.stringify({ items: items.value }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.add({
          severity: "error",
          summary:  `${action === "send" ? "Submit" : "Accept"} failed`,
          detail:   body.message ?? `Server error (HTTP ${res.status})`,
          closable: true,
          life:     6000,
        });
        return;
      }

       toast.add({
        severity: "success",
        ...successMsg,
        closable: true,
        life:     4000,
      });
      drawer.closeDrawer();
     } catch (err) {
       toast.add({
        severity: "error",
        summary:  "Network error",
        detail:   err.message,
        closable: true,
        life:     6000,
      });
     } finally {
      isSubmitting.value = false;
     }
  }
}

function closeDrawer() {
  drawer.closeDrawer();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="drawer.showDrawer"
        class="drawer-overlay"
        @click.self="closeDrawer"
      >
        <Transition name="drawer-slide" appear>
          <div class="drawer-panel" role="dialog" aria-modal="true">
            <div class="drawer-header">
              <div class="dh-left">
                <div class="dh-badge">RFQ</div>
                <div class="dh-titles">
                  <h2 class="dh-title">
                    {{
                      drawer.drawerRole === "purchase"
                        ? "Purchase Accept"
                        : "User Fill Data"
                    }}
                  </h2>
                  <span class="dh-sub">
                    RFQ · EN-{{
                      new Date().toISOString().slice(0, 10).replace(/-/g, "")
                    }}
                    · {{ items.length }} Item{{ items.length > 1 ? "s" : "" }}
                  </span>
                </div>
              </div>
              <button class="dh-close" @click="closeDrawer" aria-label="Close">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <div class="pipeline-wrap">
              <div class="pipeline-track">
                <template v-for="(step, i) in allSteps" :key="step.id">
                  <div
                    class="pipe-step"
                    :class="[`status-${stepStatus(i)}`, `role-${step.role}`]"
                  >
                    <div class="pipe-node">
                      <svg
                        v-if="stepStatus(i) === 'done'"
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
                        v-else-if="stepStatus(i) === 'active'"
                        class="pipe-pulse"
                      />
                      <span v-else class="pipe-num">{{ i + 1 }}</span>
                    </div>
                    <span class="pipe-label">{{ step.label }}</span>
                  </div>

                  <div
                    v-if="i < allSteps.length - 1"
                    class="pipe-arrow"
                    :class="{ 'arrow-done': stepStatus(i) === 'done' }"
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

            <div class="drawer-body">
              <div
                v-for="(item, index) in items"
                :key="index"
                class="item-block"
              >
                <!-- Item Header -->
                <div class="item-header">
                  <div class="item-label">
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
                  </div>
                  <button
                    v-if="items.length > 1"
                    class="item-remove"
                    @click="removeItem(index)"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    Remove
                  </button>
                </div>

                <div class="form-grid">
                  <div class="form-col">
                    <div class="col-label">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      >
                        <path d="M9 11l3 3L22 4" />
                        <path
                          d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                        />
                      </svg>
                      General Info
                    </div>

                    <div class="field-row stagger-1">
                      <div class="field field-auto">
                        <label>RFQ No.</label>
                        <div class="inp-auto">Auto · EN-YYMMDD-XX</div>
                      </div>
                    </div>

                    <div class="field-row stagger-2">
                      <div class="field field-auto">
                        <label>Rev. No.</label>
                        <div class="inp-auto">Auto · Original Rev.01</div>
                      </div>
                      <div class="field field-auto">
                        <label>Item No.</label>
                        <div class="inp-auto">
                          Auto · {{ String(index + 1).padStart(2, "0") }}
                        </div>
                      </div>
                    </div>

                    <div class="field stagger-3">
                      <label>Target PUR Reply</label>
                      <DatePicker
                        v-model="item.targetPURreply"
                        showIcon
                        fluid
                        :showOnFocus="false"
                        :minDate="new Date()"
                        dateFormat="dd/mm/yy"
                        placeholder="DD/MM/YYYY"
                        class="inp-datepicker"
                      />
                      <span class="field-hint"
                        >Non back-date · calendar select</span
                      >
                    </div>

                    <div class="field stagger-4">
                      <label>Project Name</label>
                      <input
                        v-model="item.projectName"
                        type="text"
                        class="inp"
                        placeholder="Enter project name"
                      />
                    </div>

                    <div class="field stagger-5">
                      <label>GL Code</label>
                      <select v-model="item.glCode" class="inp">
                        <option value="">— Select GL Code —</option>
                        <option v-for="g in glCodeOptions" :key="g" :value="g">
                          {{ g }}
                        </option>
                      </select>
                    </div>

                    <div class="field stagger-6">
                      <label>SAP Item No.</label>
                      <div class="radio-group">
                        <label
                          class="radio-opt"
                          :class="{ active: item.sapItemNo === 'new' }"
                        >
                          <input
                            v-model="item.sapItemNo"
                            type="radio"
                            value="new"
                          />
                          <span>New</span>
                        </label>
                        <label
                          class="radio-opt"
                          :class="{ active: item.sapItemNo === 'existing' }"
                        >
                          <input
                            v-model="item.sapItemNo"
                            type="radio"
                            value="existing"
                          />
                          <span>SAP Item No.</span>
                        </label>
                      </div>
                      <input
                        v-if="item.sapItemNo === 'existing'"
                        v-model="item.sapItemNoText"
                        type="text"
                        class="inp mt-6"
                        placeholder="Enter SAP item number"
                      />
                    </div>

                    <div class="field stagger-7">
                      <label>Item Description</label>
                      <input
                        v-model="item.itemDescription"
                        type="text"
                        class="inp"
                        placeholder="Item description"
                      />
                    </div>

                    <div class="field stagger-8">
                      <label>Specification / Part No.</label>
                      <input
                        v-model="item.specPartNo"
                        type="text"
                        class="inp"
                        placeholder="Spec or part number"
                      />
                    </div>

                    <div class="field stagger-9">
                      <label>Model</label>
                      <input
                        v-model="item.model"
                        type="text"
                        class="inp"
                        placeholder="Fix Model or N/A"
                      />
                      <span class="field-hint"
                        >กรณีไม่มี Fix Model สามารถใส่ N/A ได้</span
                      >
                    </div>

                    <div class="field-row stagger-10">
                      <div class="field">
                        <label>Brand</label>
                        <input
                          v-model="item.brand"
                          type="text"
                          class="inp"
                          placeholder="Brand name"
                        />
                      </div>
                      <div class="field">
                        <label>For GAS</label>
                        <input
                          v-model="item.forGas"
                          type="text"
                          class="inp"
                          placeholder="Gas type"
                        />
                      </div>
                    </div>

                    <div class="field stagger-11">
                      <label>DWG or Specification</label>
                      <div class="attach-grid">
                        <label class="attach-btn">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          >
                            <path
                              d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                            />
                          </svg>
                          DWG
                          <input
                            type="file"
                            class="file-hidden"
                            accept=".dwg,.dxf"
                          />
                        </label>
                        <label class="attach-btn">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          >
                            <path
                              d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                            />
                          </svg>
                          Spec
                          <input type="file" class="file-hidden" />
                        </label>
                        <label class="attach-btn">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          >
                            <path
                              d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                            />
                          </svg>
                          Last Quotation
                          <input type="file" class="file-hidden" />
                        </label>
                        <label class="attach-btn">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          >
                            <path
                              d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                            />
                          </svg>
                          ETC.
                          <input type="file" class="file-hidden" />
                        </label>
                      </div>
                    </div>

                    <div class="field stagger-12">
                      <label>User / Engineer / Sale</label>
                      <div class="inp-auto">Database · From Email User</div>
                    </div>
                  </div>

                  <div class="col-divider" />

                  <div class="form-col">
                    <div class="col-label">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4l3 3" />
                      </svg>
                      Product Specification
                    </div>

                    <div class="field-row stagger-1">
                      <div class="field field-auto">
                        <label>Req Date</label>
                        <div class="inp-auto">Auto · System Date</div>
                      </div>
                      <div class="field">
                        <label>Type</label>
                        <select v-model="item.type" class="inp">
                          <option value="">— Select —</option>
                          <option v-for="t in typeOptions" :key="t" :value="t">
                            {{ t }}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div class="field stagger-2">
                      <label>Specification / Purity</label>
                      <input
                        v-model="item.specPurity"
                        type="text"
                        class="inp"
                        placeholder="e.g. 99.999%"
                      />
                    </div>

                    <div class="field stagger-3">
                      <label>Cylinder Type</label>
                      <input
                        v-model="item.cylinderType"
                        type="text"
                        class="inp"
                        placeholder="Cylinder type"
                      />
                    </div>

                    <div class="field-row stagger-4">
                      <div class="field">
                        <label>Quantity</label>
                        <input
                          v-model="item.quantity"
                          type="number"
                          class="inp"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div class="field">
                        <label>UOM</label>
                        <input
                          v-model="item.uom"
                          type="text"
                          class="inp"
                          placeholder="e.g. KG, L"
                        />
                      </div>
                    </div>

                    <div class="field stagger-5">
                      <label>Cylinder Size (L)</label>
                      <input
                        v-model="item.cylinderSize"
                        type="text"
                        class="inp"
                        placeholder="Size in litres"
                      />
                    </div>

                    <div class="field stagger-6">
                      <label>Maker / Source</label>
                      <input
                        v-model="item.makerSource"
                        type="text"
                        class="inp"
                        placeholder="Manufacturer or source"
                      />
                    </div>

                    <div class="field stagger-7">
                      <label>Required Type Valve</label>
                      <input
                        v-model="item.requiredValve"
                        type="text"
                        class="inp"
                        placeholder="Valve type"
                      />
                    </div>

                    <div class="field stagger-8">
                      <label>Purpose / Application</label>
                      <input
                        v-model="item.purposeApplication"
                        type="text"
                        class="inp"
                        placeholder="Purpose or application"
                      />
                    </div>

                    <div class="field stagger-9">
                      <label>Customer</label>
                      <input
                        v-model="item.customer"
                        type="text"
                        class="inp"
                        placeholder="Customer name"
                      />
                    </div>

                    <div class="field stagger-10">
                      <label>Address / Location</label>
                      <input
                        v-model="item.addressLocation"
                        type="text"
                        class="inp"
                        placeholder="Delivery address"
                      />
                    </div>

                    <div class="field stagger-11">
                      <label>Recommend Vendor / Brand</label>
                      <input
                        v-model="item.recommendVendor"
                        type="text"
                        class="inp"
                        placeholder="Preferred vendor or brand"
                      />
                    </div>

                    <div class="field stagger-12">
                      <label>Remark</label>
                      <textarea
                        v-model="item.remark"
                        class="inp inp-textarea"
                        placeholder="Additional remarks..."
                        rows="3"
                      />
                    </div>

                    <div class="field stagger-12">
                      <label>Buyer</label>
                      <div class="inp-auto">
                        Database · From Email PUR Accept
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Divider ระหว่าง items -->
                <div v-if="index < items.length - 1" class="item-divider" />
              </div>
            </div>

            <!-- ══ FOOTER ══ -->
            <div class="drawer-footer">
              <div class="footer-info">
                <span class="footer-role-badge">
                  {{
                    drawer.drawerRole === "purchase" ? "🏢 Purchase" : "👤 User"
                  }}
                </span>
                <span class="footer-hint">
                  Step {{ activeStepIndex + 1 }} of {{ allSteps.length }} ·
                  {{ items.length }}/50 Items
                </span>
              </div>
              <div class="footer-actions">
               <button
  v-for="act in footerActions"
  :key="act.action"
  :class="`footer-btn footer-btn-${act.style}`"
  :disabled="(act.action === 'add' && items.length >= 50) || isSubmitting"
  @click="handleAction(act.action)"
>
  <span v-if="isSubmitting && (act.action === 'send' || act.action === 'accept')">
    <i class="pi pi-spin pi-spinner" style="font-size: 12px;" />
    Processing…
  </span>
  <span v-else>{{ act.label }}</span>
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

.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 800;
  background: rgba(0, 0, 0, 0.5);
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

.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: color-mix(
    in srgb,
    var(--bg-base, #060c18) 84%,
    var(--orb-1, #1a3d9e) 16%
  );
  border-left: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  box-shadow: -24px 0 80px rgba(0, 0, 0, 0.45);
  font-family: "DM Sans", sans-serif;
  overflow: hidden;
}
[data-theme="light"] .drawer-panel {
  background: color-mix(in srgb, #f8faff 90%, var(--orb-1, #bfdbfe) 10%);
  border-left-color: rgba(0, 0, 0, 0.08);
  box-shadow: -16px 0 60px rgba(0, 0, 0, 0.12);
}

.drawer-slide-enter-active {
  animation: slideInFromRight 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.drawer-slide-leave-active {
  animation: slideOutToRight 0.28s cubic-bezier(0.4, 0, 1, 1) both;
}
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes slideOutToRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.07));
  flex-shrink: 0;
  background: var(--bg-surface, rgba(255, 255, 255, 0.03));
}
.dh-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dh-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--accent-dim, rgba(56, 163, 245, 0.15));
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.25));
  color: var(--accent, #38a3f5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Sora", sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.dh-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0 0 2px;
}
.dh-sub {
  font-size: 11.5px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
}
.dh-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, rgba(255, 255, 255, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}
.dh-close:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.pipeline-wrap {
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.07));
  flex-shrink: 0;
  background: var(--bg-surface, rgba(255, 255, 255, 0.02));
  overflow-x: auto;
}
.pipeline-track {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: max-content;
}
.pipe-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 76px;
}
.pipe-node {
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
.pipe-label {
  font-size: 9.5px;
  font-weight: 500;
  text-align: center;
  line-height: 1.3;
  white-space: pre-line;
  letter-spacing: 0.02em;
}
.pipe-num {
  font-size: 11px;
  font-weight: 700;
}

.status-done .pipe-node {
  background: rgba(16, 185, 129, 0.2);
  border: 1.5px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
}
.status-done .pipe-label {
  color: #34d399;
}

.status-active .pipe-node {
  background: var(--accent-dim, rgba(56, 163, 245, 0.2));
  border: 2px solid var(--accent, #38a3f5);
  color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 4px var(--accent-dim, rgba(56, 163, 245, 0.12));
}
.status-active .pipe-label {
  color: var(--accent, #38a3f5);
  font-weight: 700;
}

.status-pending .pipe-node {
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, rgba(255, 255, 255, 0.3));
}
.status-pending .pipe-label {
  color: var(--text-muted, rgba(255, 255, 255, 0.3));
}

.pipe-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent, #38a3f5);
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

.pipe-arrow {
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  color: var(--border-subtle, rgba(255, 255, 255, 0.15));
  min-width: 18px;
  justify-content: center;
}
.pipe-arrow.arrow-done {
  color: rgba(52, 211, 153, 0.5);
}

/* ══════════════════════════════════════
   FORM BODY
══════════════════════════════════════ */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-accent, rgba(56, 163, 245, 0.2)) transparent;
}
.drawer-body::-webkit-scrollbar {
  width: 4px;
}
.drawer-body::-webkit-scrollbar-thumb {
  background: var(--border-accent, rgba(56, 163, 245, 0.2));
  border-radius: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 0 20px;
}
.col-divider {
  background: var(--border-subtle, rgba(255, 255, 255, 0.07));
  margin: 0;
}
.form-col {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.col-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent, #38a3f5);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.07));
}

.field {
  margin-bottom: 12px;
  animation: fadeUpIn 0.35s ease both;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
  animation: fadeUpIn 0.35s ease both;
}

.stagger-1 {
  animation-delay: 0.08s;
}
.stagger-2 {
  animation-delay: 0.11s;
}
.stagger-3 {
  animation-delay: 0.14s;
}
.stagger-4 {
  animation-delay: 0.17s;
}
.stagger-5 {
  animation-delay: 0.2s;
}
.stagger-6 {
  animation-delay: 0.23s;
}
.stagger-7 {
  animation-delay: 0.26s;
}
.stagger-8 {
  animation-delay: 0.29s;
}
.stagger-9 {
  animation-delay: 0.32s;
}
.stagger-10 {
  animation-delay: 0.35s;
}
.stagger-11 {
  animation-delay: 0.38s;
}
.stagger-12 {
  animation-delay: 0.41s;
}

@keyframes fadeUpIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.field label,
.field-row label {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted, rgba(255, 255, 255, 0.45));
  margin-bottom: 5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.inp {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.09));
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  padding: 8px 11px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
  box-sizing: border-box;
}
.inp:focus {
  border-color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 2px var(--accent-dim, rgba(56, 163, 245, 0.15));
  background: rgba(255, 255, 255, 0.07);
}
.inp::placeholder {
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
}
select.inp option {
  background: var(--bg-base, #060c18);
  color: var(--text-primary, #fff);
}

[data-theme="light"] .inp {
  background: #f5f7fc;
  border-color: rgba(0, 0, 0, 0.1);
  color: #08174a;
}
[data-theme="light"] .inp:focus {
  background: #fff;
}
[data-theme="light"] .inp::placeholder {
  color: #b0b8cc;
}
[data-theme="light"] select.inp option {
  background: #fff;
  color: #08174a;
}

.inp-textarea {
  resize: vertical;
  min-height: 72px;
}

.inp-auto {
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed var(--border-subtle, rgba(255, 255, 255, 0.09));
  border-radius: 8px;
  color: var(--text-muted, rgba(255, 255, 255, 0.35));
  font-size: 12px;
  padding: 8px 11px;
  font-style: italic;
}
[data-theme="light"] .inp-auto {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
  color: #8892a4;
}

.field-hint {
  display: block;
  font-size: 10px;
  color: var(--text-muted, rgba(255, 255, 255, 0.3));
  margin-top: 3px;
}
.field-auto {
  flex: 1;
}
.mt-6 {
  margin-top: 6px;
}

.radio-group {
  display: flex;
  gap: 8px;
}
.radio-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.09));
  background: rgba(255, 255, 255, 0.04);
  font-size: 12.5px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.65));
  transition: all 0.18s;
  user-select: none;
}
.radio-opt input[type="radio"] {
  display: none;
}
.radio-opt.active {
  background: var(--accent-dim, rgba(56, 163, 245, 0.12));
  border-color: var(--border-accent, rgba(56, 163, 245, 0.3));
  color: var(--accent, #38a3f5);
}
[data-theme="light"] .radio-opt {
  background: #f5f7fc;
  border-color: rgba(0, 0, 0, 0.1);
  color: #374151;
}
[data-theme="light"] .radio-opt.active {
  background: var(--accent-dim);
  color: var(--accent);
}

.attach-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
.attach-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px dashed var(--border-subtle, rgba(255, 255, 255, 0.12));
  background: rgba(255, 255, 255, 0.03);
  font-size: 12px;
  color: var(--text-muted, rgba(255, 255, 255, 0.45));
  transition: all 0.18s;
  user-select: none;
}
.attach-btn:hover {
  border-color: var(--border-accent, rgba(56, 163, 245, 0.3));
  color: var(--accent, #38a3f5);
  background: var(--accent-dim, rgba(56, 163, 245, 0.08));
}
.file-hidden {
  display: none;
}

/* ══════════════════════════════════════
   FOOTER
══════════════════════════════════════ */
.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.07));
  flex-shrink: 0;
  background: var(--bg-surface, rgba(255, 255, 255, 0.02));
  gap: 12px;
}
.footer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.footer-role-badge {
  font-size: 11.5px;
  font-weight: 600;
  background: var(--accent-dim, rgba(56, 163, 245, 0.12));
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.2));
  color: var(--accent, #38a3f5);
  padding: 3px 10px;
  border-radius: 6px;
}
.footer-hint {
  font-size: 11px;
  color: var(--text-muted, rgba(255, 255, 255, 0.3));
}
.footer-actions {
  display: flex;
  gap: 8px;
}

.footer-btn-ghost {
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  background: transparent;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  transition: all 0.18s;
}
.footer-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary, #fff);
}

.footer-btn-outline {
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  background: transparent;
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.35));
  color: var(--accent, #38a3f5);
  transition: all 0.18s;
}
.footer-btn-outline:hover {
  background: var(--accent-dim, rgba(56, 163, 245, 0.1));
}

.footer-btn-primary {
  padding: 9px 22px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: "Sora", sans-serif;
  border: none;
  color: #fff;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent, #1a3d9e) 80%, black),
    var(--accent, #1a3d9e) 50%,
    color-mix(in srgb, var(--accent, #38a3f5) 80%, white)
  );
  box-shadow: 0 4px 14px var(--accent-glow, rgba(56, 163, 245, 0.3));
  transition:
    transform 0.15s,
    box-shadow 0.2s;
}
.footer-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--accent-glow, rgba(56, 163, 245, 0.4));
}

[data-theme="light"] .footer-btn-ghost {
  border-color: rgba(0, 0, 0, 0.12);
  color: #6b7280;
}
[data-theme="light"] .footer-btn-ghost:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #374151;
}
.item-block {
  margin-bottom: 8px;
}
.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-accent, rgba(56, 163, 245, 0.2));
}
.item-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: "Sora", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent, #38a3f5);
  letter-spacing: 0.05em;
}
.item-remove {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(248, 113, 113, 0.7);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.18s;
}
.item-remove:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}
.item-divider {
  height: 1px;
  background: var(--border-subtle, rgba(255, 255, 255, 0.06));
  margin: 24px 0;
}
.footer-btn-outline:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.inp-datepicker {
  width: 100%;
}
:deep(.p-datepicker-input) {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.09));
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  padding: 8px 11px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
:deep(.p-datepicker-input:focus) {
  border-color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 2px var(--accent-dim, rgba(56, 163, 245, 0.15));
}
:deep(.p-datepicker-input::placeholder) {
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
}
:deep(.p-datepicker-dropdown) {
  background: var(--accent-dim, rgba(56, 163, 245, 0.15));
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.3));
  border-radius: 0 8px 8px 0;
  color: var(--accent, #38a3f5);
}
</style>
