<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import DatePicker from "primevue/datepicker";
import Select from "primevue/select";
import { apiFetch } from "../../utils/api";

import Message from "primevue/message";
import InputText from "primevue/inputtext";

const drawer = useRFQDrawerStore();
const toast = useToast();
const isSubmitting = ref(false);
const category = computed(() => drawer.category);
const BASE = `${import.meta.env.VITE_LOCAL_BACKEND}`;

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
watch(
  prefilledType,
  (val) => {
    if (val && items.value.length > 0) {
      items.value[0].type = val;
    }
  },
  { immediate: true },
);

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
  sapItem: "",
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
  attachDWG: null,
  attachSpec: null,
  attachQuotation: null,
  attachEtc: null,
});

// ── Patterns ──
const PATTERNS = {
  brand: /^[a-zA-Z0-9\s\-&.,()]+$/,
  forGas: /^[a-zA-Z0-9ก-๙\s\-/()%.,]+$/,
  specPurity: /^[a-zA-Z0-9ก-๙\s%./\-(),]+$/,
  cylinderType: /^[a-zA-Z0-9ก-๙\s%./\-(),]+$/,
  uom: /^[a-zA-Z0-9/]+$/,
  cylinderSize: /^\d+(\.\d+)?$/,
  makerSource: /^[a-zA-Z0-9\s\-/&.,()]+$/,
  requiredValve: /^[a-zA-Z0-9\s\-/(),']+$/,
  noWeirdChars: /^[^@~#$^`*]+$/, // purposeApplication, addressLocation, remark
  customer: /^[a-zA-Z0-9ก-๙\s\-.(),&']+$/,
  recommendVendor: /^[a-zA-Z0-9ก-๙\s\-/&.,()]+$/,
};

const items = ref([createEmptyItem()]);

function addItem() {
  if (items.value.length < 50) {
    items.value.push(createEmptyItem());
  }
}

function clearError(index, field) {
  const key = `items[${index}].${field}`;
  if (errors.value[key]) {
    delete errors.value[key];
  }
}

function removeItem(index) {
  if (items.value.length > 1) {
    items.value.splice(index, 1);
  }
}

const fileInputRefs = ref({});

function onFileChange(event, item, field) {
  item[field] = event.target.files[0] ?? null;
  const idx = items.value.indexOf(item);
  const key = `items[${idx}].attachDWG`;
  if (errors.value[key]) delete errors.value[key];
  clearError(idx, field);
}

function removeFile(item, field) {
  const idx = items.value.indexOf(item);
  item[field] = null;
  const refKey = `${idx}_${field}`;
  if (fileInputRefs.value[refKey]) {
    fileInputRefs.value[refKey].value = "";
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

const glCodeOptions = ref([]);
const isLoadingGlCodes = ref(false);

async function fetchGlCodes() {
  isLoadingGlCodes.value = true;
  try {
    const res = await apiFetch(`${BASE}/api/doc-request/gl-code`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    glCodeOptions.value = data.map((g) => ({
      code: g.code,
      description: g.description,
    }));
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "โหลด GL Code ไม่สำเร็จ",
      detail: err.message,
      life: 4000,
    });
  } finally {
    isLoadingGlCodes.value = false;
  }
}

onMounted(() => {
  fetchGlCodes();
  fetchSapItems();
});

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

const errors = ref({});

function validate() {
  const result = resolver({ values: { items: items.value } });
  errors.value = result.errors;
  return Object.keys(result.errors).length === 0;
}

async function handleAction(action) {
  // Validate
  if (!validate()) {
    toast.add({
      severity: "warn",
      summary: "กรุณากรอกข้อมูลให้ครบ",
      detail: "มีบางช่องที่ยังไม่ได้กรอก",
      life: 4000,
    });
    return;
  }

  if (action === "cancel" || action === "draft") {
    drawer.closeDrawer();
    return;
  }
  if (action === "add") {
    addItem();
    toast.add({
      severity: "info",
      summary: "Item added",
      detail: `Item ${items.value.length} added. (${items.value.length}/50)`,
      closable: true,
      life: 2500,
    });
    return;
  }

  if (action === "reject") {
    isSubmitting.value = true;
    try {
      const res = await apiFetch(`${BASE}/api/doc-request/reject`, {
        method: "POST",
        body: JSON.stringify({ items: items.value }),
      });

      if (res.status === 401) {
        toast.add({
          severity: "error",
          summary: "Session expired",
          detail: "Please log in again.",
          closable: true,
          life: 5000,
        });
        router.push("/login");
        return;
      }

      if (!res.ok) {
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
      });
    } finally {
      isSubmitting.value = false;
    }
    return;
  }

  // Send (User only)
  if (action === "send") {
    isSubmitting.value = true;
    try {
      const formData = new FormData();

      items.value.forEach((item, i) => {
        // ── Text fields ──
        formData.append(
          `items[${i}][targetPURreply]`,
          item.targetPURreply instanceof Date
            ? item.targetPURreply.toISOString().slice(0, 10)
            : (item.targetPURreply ?? ""),
        );
        formData.append(`items[${i}][projectName]`, item.projectName ?? "");
        formData.append(`items[${i}][glCode]`, item.glCode ?? "");
        formData.append(`items[${i}][sapItem]`, item.sapItem ?? "");
        formData.append(
          `items[${i}][itemDescription]`,
          item.itemDescription ?? "",
        );
        formData.append(`items[${i}][specPartNo]`, item.specPartNo ?? "");
        formData.append(`items[${i}][model]`, item.model ?? "");
        formData.append(`items[${i}][brand]`, item.brand ?? "");
        formData.append(`items[${i}][forGas]`, item.forGas ?? "");
        formData.append(`items[${i}][type]`, item.type ?? "");
        formData.append(`items[${i}][specPurity]`, item.specPurity ?? "");
        formData.append(`items[${i}][cylinderType]`, item.cylinderType ?? "");
        formData.append(`items[${i}][quantity]`, item.quantity ?? "");
        formData.append(`items[${i}][uom]`, item.uom ?? "");
        formData.append(`items[${i}][cylinderSize]`, item.cylinderSize ?? "");
        formData.append(`items[${i}][makerSource]`, item.makerSource ?? "");
        formData.append(`items[${i}][requiredValve]`, item.requiredValve ?? "");
        formData.append(
          `items[${i}][purposeApplication]`,
          item.purposeApplication ?? "",
        );
        formData.append(`items[${i}][customer]`, item.customer ?? "");
        formData.append(
          `items[${i}][addressLocation]`,
          item.addressLocation ?? "",
        );
        formData.append(
          `items[${i}][recommendVendor]`,
          item.recommendVendor ?? "",
        );
        formData.append(`items[${i}][remark]`, item.remark ?? "");

        // ── Files (ถ้ามี) ──
        if (item.attachDWG)
          formData.append(`items[${i}][attachDWG]`, item.attachDWG);
        if (item.attachSpec)
          formData.append(`items[${i}][attachSpec]`, item.attachSpec);
        if (item.attachQuotation)
          formData.append(`items[${i}][attachQuotation]`, item.attachQuotation);
        if (item.attachEtc)
          formData.append(`items[${i}][attachEtc]`, item.attachEtc);
      });

      const res = await fetch(`${BASE}/api/doc-request/create`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (res.status === 401) {
        toast.add({
          severity: "error",
          summary: "Session expired",
          detail: "Please log in again.",
          closable: true,
          life: 5000,
        });
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.add({
          severity: "error",
          summary: "Submit failed",
          detail: body.message ?? `Server error (HTTP ${res.status})`,
          closable: true,
          life: 6000,
        });
        return;
      }

      toast.add({
        severity: "success",
        summary: "Request sent",
        detail: "Your RFQ has been submitted to Purchase.",
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
      });
    } finally {
      isSubmitting.value = false;
    }
  }

  // Accept (Purchase only)
  if (action === "accept") {
    isSubmitting.value = true;
    try {
      const res = await fetch(`${BASE}/api/doc-request/accept`, {
        method: "POST",
        body: JSON.stringify({ items: items.value }),
      });

      if (res.status === 401) {
        toast.add({
          severity: "error",
          summary: "Session expired",
          detail: "Please log in again.",
          closable: true,
          life: 5000,
        });
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.add({
          severity: "error",
          summary: "Accept failed",
          detail: body.message ?? `Server error (HTTP ${res.status})`,
          closable: true,
          life: 6000,
        });
        return;
      }

      toast.add({
        severity: "success",
        summary: "Request accepted",
        detail: "RFQ accepted and moved to next step.",
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
      });
    } finally {
      isSubmitting.value = false;
    }
  }
}

// ── SAP Options ──
const sapItemOptions = ref([]);
const isLoadingSapItems = ref(false);

async function fetchSapItems(params) {
  isLoadingSapItems.value = true;
  try {
    const res = await apiFetch(`${BASE}/api/doc-request/sap-item`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    sapItemOptions.value = data.map((s) => ({
      code: s.code,
      description: s.description,
    }));
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "โหลด SAP Item ไม่สำเร็จ",
      detail: err.message,
      life: 4000,
    });
  } finally {
    isLoadingSapItems.value = false;
  }
}

// validation rules
const resolver = ({ values }) => {
  const errors = {};

  values.items?.forEach((item, i) => {
    // ── General Info ──
    if (!item.targetPURreply)
      if (!item.targetPURreply)
        errors[`items[${i}].targetPURreply`] = [
          { message: "กรุณาเลือก Target PUR Reply" },
        ];

    if (!item.projectName?.trim())
      errors[`items[${i}].projectName`] = [
        { message: "กรุณากรอก Project Name" },
      ];
    else if (item.projectName.trim().length > 150)
      errors[`items[${i}].projectName`] = [
        { message: "Project Name ต้องไม่เกิน 150 ตัวอักษร" },
      ];

    if (!item.glCode)
      errors[`items[${i}].glCode`] = [{ message: "กรุณาเลือก GL Code" }];

    if (!item.sapItem)
      errors[`items[${i}].sapItem`] = [
        { message: "กรุณากเลือก SAP Item Number" },
      ];

    if (!item.itemDescription?.trim())
      errors[`items[${i}].itemDescription`] = [
        { message: "กรุณากรอก Item Description" },
      ];
    else if (item.itemDescription.trim().length > 500)
      errors[`items[${i}].itemDescription`] = [
        { message: "Item Description ต้องไม่เกิน 500 ตัวอักษร" },
      ];

    if (!item.specPartNo?.trim())
      errors[`items[${i}].specPartNo`] = [
        { message: "กรุณากรอก Specification / Part No." },
      ];
    else if (item.specPartNo.trim().length > 200)
      errors[`items[${i}].specPartNo`] = [
        { message: "Spec / Part No. ต้องไม่เกิน 200 ตัวอักษร" },
      ];

    if (item.model?.trim().length > 100)
      errors[`items[${i}].model`] = [
        { message: "Model ต้องไม่เกิน 100 ตัวอักษร" },
      ];

    if (!item.brand?.trim())
      errors[`items[${i}].brand`] = [{ message: "กรุณากรอก Brand" }];
    else if (item.brand.trim().length > 100)
      errors[`items[${i}].brand`] = [
        { message: "Brand ต้องไม่เกิน 100 ตัวอักษร" },
      ];
    else if (!PATTERNS.brand.test(item.brand.trim()))
      errors[`items[${i}].brand`] = [
        { message: "Brand ใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข และ - & . , ( )" },
      ];

    if (!item.forGas?.trim())
      errors[`items[${i}].forGas`] = [{ message: "กรุณากรอก For GAS" }];
    else if (item.forGas.trim().length > 100)
      errors[`items[${i}].forGas`] = [
        { message: "For GAS ต้องไม่เกิน 100 ตัวอักษร" },
      ];
    else if (!PATTERNS.forGas.test(item.forGas.trim()))
      errors[`items[${i}].forGas`] = [
        { message: "For GAS มีอักขระที่ไม่อนุญาต (@ ~ # $ ^ `)" },
      ];

    if (!item.attachDWG)
      errors[`items[${i}].attachDWG`] = [
        { message: "กรุณาแนบไฟล์ DWG หรือ Specification อย่างน้อย 1 ไฟล์" },
      ];

    if (!item.type)
      errors[`items[${i}].type`] = [{ message: "กรุณาเลือก Type" }];

    if (!item.specPurity?.trim())
      errors[`items[${i}].specPurity`] = [
        { message: "กรุณากรอก Specification / Purity" },
      ];

    if (!item.cylinderType?.trim())
      errors[`items[${i}].cylinderType`] = [
        { message: "กรุณากรอก Cylinder Type" },
      ];
    else if (item.cylinderType.trim().length > 100)
      errors[`items[${i}].cylinderType`] = [
        { message: "Cylinder Type ต้องไม่เกิน 100 ตัวอักษร" },
      ];
    else if (!PATTERNS.cylinderType.test(item.cylinderType.trim()))
      errors[`items[${i}].cylinderType`] = [
        { message: "Cylinder Type มีอักขระที่ไม่อนุญาต" },
      ];

    if (
      !item.quantity ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) <= 0
    )
      errors[`items[${i}].quantity`] = [
        { message: "กรุณากรอก Quantity เป็นจำนวนเต็มและมากกว่า 0" },
      ];

    if (!item.uom?.trim())
      errors[`items[${i}].uom`] = [{ message: "กรุณากรอก UOM" }];
    else if (item.uom.trim().length > 20)
      errors[`items[${i}].uom`] = [{ message: "UOM ต้องไม่เกิน 20 ตัวอักษร" }];
    else if (!PATTERNS.uom.test(item.uom.trim()))
      errors[`items[${i}].uom`] = [
        { message: "UOM ใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข และ /" },
      ];

    if (!item.cylinderSize?.trim())
      errors[`items[${i}].cylinderSize`] = [
        { message: "กรุณากรอก Cylinder Size" },
      ];
    else if (!PATTERNS.cylinderSize.test(item.cylinderSize.trim()))
      errors[`items[${i}].cylinderSize`] = [
        { message: "Cylinder Size ต้องเป็นตัวเลขเท่านั้น เช่น 50 หรือ 47.5" },
      ];

    if (!item.makerSource?.trim())
      errors[`items[${i}].makerSource`] = [
        { message: "กรุณากรอก Maker / Source" },
      ];
    else if (item.makerSource.trim().length > 150)
      errors[`items[${i}].makerSource`] = [
        { message: "Maker / Source ต้องไม่เกิน 150 ตัวอักษร" },
      ];
    else if (!PATTERNS.makerSource.test(item.makerSource.trim()))
      errors[`items[${i}].makerSource`] = [
        {
          message:
            "Maker / Source ใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข และ - / & . , ( )",
        },
      ];

    if (!item.requiredValve?.trim())
      errors[`items[${i}].requiredValve`] = [
        { message: "กรุณากรอก Required Type Valve" },
      ];
    else if (item.requiredValve.trim().length > 100)
      errors[`items[${i}].requiredValve`] = [
        { message: "Required Valve ต้องไม่เกิน 100 ตัวอักษร" },
      ];
    else if (!PATTERNS.requiredValve.test(item.requiredValve.trim()))
      errors[`items[${i}].requiredValve`] = [
        { message: "Required Valve มีอักขระที่ไม่อนุญาต" },
      ];

    if (!item.purposeApplication?.trim())
      errors[`items[${i}].purposeApplication`] = [
        { message: "กรุณากรอก Purpose / Application" },
      ];
    else if (item.purposeApplication.trim().length > 300)
      errors[`items[${i}].purposeApplication`] = [
        { message: "Purpose / Application ต้องไม่เกิน 300 ตัวอักษร" },
      ];
    else if (!PATTERNS.noWeirdChars.test(item.purposeApplication.trim()))
      errors[`items[${i}].purposeApplication`] = [
        { message: "มีอักขระที่ไม่อนุญาต (@ ~ # $ ^ `)" },
      ];

    if (!item.customer?.trim())
      errors[`items[${i}].customer`] = [{ message: "กรุณากรอก Customer" }];
    else if (item.customer.trim().length > 150)
      errors[`items[${i}].customer`] = [
        { message: "Customer ต้องไม่เกิน 150 ตัวอักษร" },
      ];
    else if (!PATTERNS.customer.test(item.customer.trim()))
      errors[`items[${i}].customer`] = [
        { message: "Customer มีอักขระที่ไม่อนุญาต" },
      ];

    if (!item.addressLocation?.trim())
      errors[`items[${i}].addressLocation`] = [
        { message: "กรุณากรอก Address / Location" },
      ];
    else if (item.addressLocation.trim().length > 300)
      errors[`items[${i}].addressLocation`] = [
        { message: "Address ต้องไม่เกิน 300 ตัวอักษร" },
      ];
    else if (!PATTERNS.noWeirdChars.test(item.addressLocation.trim()))
      errors[`items[${i}].addressLocation`] = [
        { message: "Address มีอักขระที่ไม่อนุญาต (@ ~ # $ ^ `)" },
      ];

    if (!item.recommendVendor?.trim())
      errors[`items[${i}].recommendVendor`] = [
        { message: "กรุณากรอก Recommend Vendor / Brand" },
      ];
    else if (item.recommendVendor.trim().length > 200)
      errors[`items[${i}].recommendVendor`] = [
        { message: "Recommend Vendor ต้องไม่เกิน 200 ตัวอักษร" },
      ];
    else if (!PATTERNS.recommendVendor.test(item.recommendVendor.trim()))
      errors[`items[${i}].recommendVendor`] = [
        { message: "Recommend Vendor มีอักขระที่ไม่อนุญาต" },
      ];

    if (!item.remark?.trim())
      errors[`items[${i}].remark`] = [{ message: "กรุณากรอก Remark" }];
    else if (item.remark.trim().length > 500)
      errors[`items[${i}].remark`] = [
        { message: "Remark ต้องไม่เกิน 500 ตัวอักษร" },
      ];
  });

  return { errors };
};

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
                      <div class="field field-auto">
                        <label>Rev. No.</label>
                        <div class="inp-auto">Auto · Rev.00</div>
                      </div>
                    </div>

                    <div class="field stagger-3">
                      <label>Target PUR Reply <span class="req">*</span></label>
                      <DatePicker
                        v-model="item.targetPURreply"
                        @update:modelValue="clearError(index, 'targetPURreply')"
                        showIcon
                        fluid
                        :showOnFocus="false"
                        :minDate="new Date()"
                        dateFormat="dd/mm/yy"
                        placeholder="DD/MM/YYYY"
                        class="inp-datepicker"
                        :class="{
                          'inp-error': errors[`items[${index}].targetPURreply`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].targetPURreply`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{
                          errors[`items[${index}].targetPURreply`][0].message
                        }}
                      </Message>
                    </div>

                    <div class="field stagger-4">
                      <label>Project Name<span class="req">*</span></label>
                      <input
                        v-model="item.projectName"
                        @input="clearError(index, 'projectName')"
                        type="text"
                        class="inp"
                        maxlength="150"
                        placeholder="Enter project name"
                        :class="{
                          'inp-error': errors[`items[${index}].projectName`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].projectName`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].projectName`][0].message }}
                      </Message>
                    </div>

                    <div class="field stagger-5">
                      <label>GL Code <span class="req">*</span></label>
                      <Select
                        v-model="item.glCode"
                        @update:modelValue="clearError(index, 'glCode')"
                        :options="glCodeOptions"
                        optionLabel="description"
                        optionValue="code"
                        :placeholder="
                          isLoadingGlCodes
                            ? 'กำลังโหลด...'
                            : '— Select GL Code —'
                        "
                        :loading="isLoadingGlCodes"
                        filter
                        filterPlaceholder="Search GL Code..."
                        showClear
                        class="gl-select"
                        :class="{
                          'inp-error-select': errors[`items[${index}].glCode`],
                        }"
                        :pt="{
                          root: { style: 'width: 100%' },
                        }"
                      >
                        <!-- Custom option แสดง code + label -->
                        <template #option="{ option }">
                          <div class="gl-option">
                            <span class="gl-code">{{ option.code }}</span>
                            <span class="gl-desc">{{
                              option.description
                            }}</span>
                          </div>
                        </template>

                        <!-- แสดงค่าที่เลือกแล้ว -->
                        <template #value="{ value }">
                          <span v-if="value">
                            {{ value }} ·
                            {{
                              glCodeOptions.find((g) => g.code === value)
                                ?.description
                            }}
                          </span>
                          <span v-else class="gl-placeholder"
                            >— Select GL Code —</span
                          >
                        </template>
                      </Select>

                      <p
                        v-if="errors[`items[${index}].glCode`]"
                        class="field-error"
                      >
                        {{ errors[`items[${index}].glCode`][0].message }}
                      </p>
                    </div>

                    <div class="field stagger-6">
                      <label>SAP Item No.</label>
                      <Select
                        v-model="item.sapItem"
                        @update:modelValue="clearError(index, 'sapItem')"
                        :options="sapItemOptions"
                        optionLabel="description"
                        optionValue="code"
                        :placeholder="
                          isLoadingSapItems
                            ? 'กำลังโหลด...'
                            : '— Select SAP Item —'
                        "
                        :loading="isLoadingSapItems"
                        filter
                        filterPlaceholder="Search SAP Item..."
                        showClear
                        class="gl-select"
                        :pt="{ root: { style: 'width: 100%' } }"
                      >
                        <template #option="{ option }">
                          <div class="gl-option">
                            <span class="gl-code">{{ option.code }}</span>
                            <span class="gl-desc">{{
                              option.description
                            }}</span>
                          </div>
                        </template>
                        <template #value="{ value }">
                          <span v-if="value">
                            {{ value }} ·
                            {{
                              sapItemOptions.find((s) => s.code === value)
                                ?.description
                            }}
                          </span>
                          <span v-else class="gl-placeholder"
                            >— Select SAP Item —</span
                          >
                        </template>
                      </Select>
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มีใน SAP</span
                      >
                    </div>

                    <div class="field stagger-7">
                      <label>Item Description <span class="req">*</span></label>
                      <input
                        v-model="item.itemDescription"
                        @input="clearError(index, 'itemDescription')"
                        type="text"
                        class="inp"
                        maxlength="500"
                        placeholder="Item description"
                        :class="{
                          'inp-error':
                            errors[`items[${index}].itemDescription`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].itemDescription`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{
                          errors[`items[${index}].itemDescription`][0].message
                        }}
                      </Message>
                    </div>

                    <div class="field stagger-8">
                      <label
                        >Specification / Part No.<span class="req"
                          >*</span
                        ></label
                      >
                      <input
                        v-model="item.specPartNo"
                        @input="clearError(index, 'specPartNo')"
                        type="text"
                        class="inp"
                        maxlength="200"
                        placeholder="Spec or part number"
                        :class="{
                          'inp-error': errors[`items[${index}].specPartNo`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].specPartNo`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].specPartNo`][0].message }}
                      </Message>
                    </div>

                    <div class="field stagger-9">
                      <label>Model</label>
                      <input
                        v-model="item.model"
                        type="text"
                        class="inp"
                        maxlength="100"
                        placeholder="Fix Model or N/A"
                      />
                      <span class="field-hint"
                        >กรณีไม่มี Fix Model สามารถใส่ N/A ได้</span
                      >
                    </div>

                    <div class="field-row stagger-10">
                      <div class="field">
                        <label>Brand<span class="req">*</span></label>
                        <input
                          v-model="item.brand"
                          @input="clearError(index, 'brand')"
                          type="text"
                          class="inp"
                          maxlength="100"
                          placeholder="Brand name"
                          :class="{
                            'inp-error': errors[`items[${index}].brand`],
                          }"
                        />
                        <Message
                          v-if="errors[`items[${index}].brand`]"
                          severity="error"
                          size="small"
                          variant="simple"
                        >
                          {{ errors[`items[${index}].brand`][0].message }}
                        </Message>
                      </div>
                      <div class="field">
                        <label>For GAS<span class="req">*</span></label>
                        <input
                          v-model="item.forGas"
                          @input="clearError(index, 'forGas')"
                          type="text"
                          class="inp"
                          maxlength="100"
                          placeholder="Gas type"
                          :class="{
                            'inp-error': errors[`items[${index}].forGas`],
                          }"
                        />
                        <Message
                          v-if="errors[`items[${index}].forGas`]"
                          severity="error"
                          size="small"
                          variant="simple"
                        >
                          {{ errors[`items[${index}].forGas`][0].message }}
                        </Message>
                      </div>
                    </div>

                    <div class="field stagger-11">
                      <label
                        >DWG or Specification <span class="req">*</span></label
                      >

                      <!-- DWG -->
                      <div class="attach-wrap">
                        <label
                          class="attach-btn"
                          :class="{
                            'attach-btn-error':
                              errors[`items[${index}].attachDWG`] &&
                              !item.attachDWG,
                            'attach-btn-done': item.attachDWG,
                          }"
                        >
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
                          <span class="attach-name">{{
                            item.attachDWG ? item.attachDWG.name : "DWG"
                          }}</span>
                          <input
                            type="file"
                            class="file-hidden"
                            accept=".dwg,.dxf,.png,.pdf"
                            :ref="
                              (el) => {
                                if (el)
                                  fileInputRefs[`${index}_attachDWG`] = el;
                              }
                            "
                            @change="onFileChange($event, item, 'attachDWG')"
                          />
                        </label>
                        <!-- ✅ ปุ่มลบ — แสดงเฉพาะมีไฟล์ -->
                        <button
                          v-if="item.attachDWG"
                          class="attach-remove"
                          @click.prevent="removeFile(item, 'attachDWG')"
                          title="ลบไฟล์"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>

                      <!-- Spec -->
                      <div class="attach-wrap">
                        <label
                          class="attach-btn"
                          :class="{ 'attach-btn-done': item.attachSpec }"
                        >
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
                          <span class="attach-name">{{
                            item.attachSpec ? item.attachSpec.name : "Spec"
                          }}</span>
                          <input
                            type="file"
                            class="file-hidden"
                            :ref="
                              (el) => {
                                if (el)
                                  fileInputRefs[`${index}_attachSpec`] = el;
                              }
                            "
                            @change="onFileChange($event, item, 'attachSpec')"
                          />
                        </label>

                        <button
                          v-if="item.attachSpec"
                          class="attach-remove"
                          @click.prevent="removeFile(item, 'attachSpec')"
                          title="ลบไฟล์"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>

                      <!-- Last Quotation -->
                      <div class="attach-wrap">
                        <label
                          class="attach-btn"
                          :class="{ 'attach-btn-done': item.attachQuotation }"
                        >
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
                          <span class="attach-name">{{
                            item.attachQuotation
                              ? item.attachQuotation.name
                              : "Last Quotation"
                          }}</span>
                          <input
                            type="file"
                            class="file-hidden"
                            :ref="
                              (el) => {
                                if (el)
                                  fileInputRefs[`${index}_attachQuotation`] =
                                    el;
                              }
                            "
                            @change="
                              onFileChange($event, item, 'attachQuotation')
                            "
                          />
                        </label>
                        <button
                          v-if="item.attachQuotation"
                          class="attach-remove"
                          @click.prevent="removeFile(item, 'attachQuotation')"
                          title="ลบไฟล์"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>

                      <!-- ETC -->
                      <div class="attach-wrap">
                        <label
                          class="attach-btn"
                          :class="{ 'attach-btn-done': item.attachEtc }"
                        >
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
                          <span class="attach-name">{{
                            item.attachEtc ? item.attachEtc.name : "ETC."
                          }}</span>
                          <input
                            type="file"
                            class="file-hidden"
                            :ref="
                              (el) => {
                                if (el)
                                  fileInputRefs[`${index}_attachEtc`] = el;
                              }
                            "
                            @change="onFileChange($event, item, 'attachEtc')"
                          />
                        </label>
                        <button
                          v-if="item.attachEtc"
                          class="attach-remove"
                          @click.prevent="removeFile(item, 'attachEtc')"
                          title="ลบไฟล์"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>

                      <!-- ✅ Message อยู่นอก attach-grid -->
                      <Message
                        v-if="errors[`items[${index}].attachDWG`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].attachDWG`][0].message }}
                      </Message>
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
                        <label>Type <span class="req">*</span></label>
                        <select
                          v-model="item.type"
                          @change="clearError(index, 'type')"
                          class="inp"
                          :class="{
                            'inp-error': errors[`items[${index}].type`],
                          }"
                        >
                          <option value="">— Select —</option>
                          <option v-for="t in typeOptions" :key="t" :value="t">
                            {{ t }}
                          </option>
                        </select>
                        <Message
                          v-if="errors[`items[${index}].type`]"
                          severity="error"
                          size="small"
                          variant="simple"
                        >
                          {{ errors[`items[${index}].type`][0].message }}
                        </Message>
                      </div>
                    </div>

                    <div class="field stagger-2">
                      <label
                        >Specification / Purity<span class="req">*</span></label
                      >
                      <input
                        v-model="item.specPurity"
                        @input="clearError(index, 'specPurity')"
                        type="text"
                        class="inp"
                        maxlength="100"
                        placeholder="e.g. 99.999%"
                        :class="{
                          'inp-error': errors[`items[${index}].specPurity`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].specPurity`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].specPurity`][0].message }}
                      </Message>
                    </div>

                    <div class="field stagger-3">
                      <label>Cylinder Type<span class="req">*</span></label>
                      <input
                        v-model="item.cylinderType"
                        @input="clearError(index, 'cylinderType')"
                        type="text"
                        class="inp"
                        maxlength="100"
                        placeholder="Cylinder type"
                        :class="{
                          'inp-error': errors[`items[${index}].cylinderType`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].cylinderType`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].cylinderType`][0].message }}
                      </Message>
                    </div>

                    <div class="field-row stagger-4">
                      <div class="field">
                        <label>Quantity <span class="req">*</span></label>
                        <input
                          v-model="item.quantity"
                          @input="clearError(index, 'quantity')"
                          type="number"
                          class="inp"
                          :class="{
                            'inp-error': errors[`items[${index}].quantity`],
                          }"
                          placeholder="0"
                          min="1"
                          step="1"
                        />
                        <Message
                          v-if="errors[`items[${index}].quantity`]"
                          severity="error"
                          size="small"
                          variant="simple"
                        >
                          {{ errors[`items[${index}].quantity`][0].message }}
                        </Message>
                      </div>
                      <div class="field">
                        <label>UOM <span class="req">*</span></label>
                        <input
                          v-model="item.uom"
                          @input="clearError(index, 'uom')"
                          type="text"
                          class="inp"
                          maxlength="20"
                          placeholder="e.g. KG, L"
                          :class="{
                            'inp-error': errors[`items[${index}].uom`],
                          }"
                        />
                        <Message
                          v-if="errors[`items[${index}].uom`]"
                          severity="error"
                          size="small"
                          variant="simple"
                        >
                          {{ errors[`items[${index}].uom`][0].message }}
                        </Message>
                      </div>
                    </div>

                    <div class="field stagger-5">
                      <label>Cylinder Size (L)<span class="req">*</span></label>
                      <input
                        v-model="item.cylinderSize"
                        @input="clearError(index, 'cylinderSize')"
                        type="text"
                        class="inp"
                        maxlength="20"
                        placeholder="Size in litres"
                        :class="{
                          'inp-error': errors[`items[${index}].cylinderSize`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].cylinderSize`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].cylinderSize`][0].message }}
                      </Message>
                    </div>

                    <div class="field stagger-6">
                      <label>Maker / Source<span class="req">*</span></label>
                      <input
                        v-model="item.makerSource"
                        @input="clearError(index, 'makerSource')"
                        type="text"
                        class="inp"
                        maxlength="150"
                        placeholder="Manufacturer or source"
                        :class="{
                          'inp-error': errors[`items[${index}].makerSource`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].makerSource`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].makerSource`][0].message }}
                      </Message>
                    </div>

                    <div class="field stagger-7">
                      <label
                        >Required Type Valve<span class="req">*</span></label
                      >
                      <input
                        v-model="item.requiredValve"
                        @input="clearError(index, 'requiredValve')"
                        type="text"
                        class="inp"
                        maxlength="100"
                        placeholder="Valve type"
                        :class="{
                          'inp-error': errors[`items[${index}].requiredValve`],
                        }"
                      />

                      <Message
                        v-if="errors[`items[${index}].requiredValve`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].requiredValve`][0].message }}
                      </Message>
                    </div>

                    <div class="field stagger-8">
                      <label
                        >Purpose / Application<span class="req">*</span></label
                      >
                      <input
                        v-model="item.purposeApplication"
                        @input="clearError(index, 'purposeApplication')"
                        type="text"
                        class="inp"
                        maxlength="300"
                        placeholder="Purpose or application"
                        :class="{
                          'inp-error':
                            errors[`items[${index}].purposeApplication`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].purposeApplication`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{
                          errors[`items[${index}].purposeApplication`][0]
                            .message
                        }}
                      </Message>
                    </div>

                    <div class="field stagger-9">
                      <label>Customer<span class="req">*</span></label>
                      <input
                        v-model="item.customer"
                        @input="clearError(index, 'customer')"
                        type="text"
                        class="inp"
                        maxlength="150"
                        placeholder="Customer name"
                        :class="{
                          'inp-error': errors[`items[${index}].customer`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].customer`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].customer`][0].message }}
                      </Message>
                    </div>

                    <div class="field stagger-10">
                      <label
                        >Address / Location<span class="req">*</span></label
                      >
                      <input
                        v-model="item.addressLocation"
                        @input="clearError(index, 'addressLocation')"
                        type="text"
                        class="inp"
                        maxlength="300"
                        placeholder="Delivery address"
                        :class="{
                          'inp-error':
                            errors[`items[${index}].addressLocation`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].addressLocation`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{
                          errors[`items[${index}].addressLocation`][0].message
                        }}
                      </Message>
                    </div>

                    <div class="field stagger-11">
                      <label
                        >Recommend Vendor / Brand<span class="req"
                          >*</span
                        ></label
                      >
                      <input
                        v-model="item.recommendVendor"
                        @input="clearError(index, 'recommendVendor')"
                        type="text"
                        class="inp"
                        maxlength="200"
                        placeholder="Preferred vendor or brand"
                        :class="{
                          'inp-error':
                            errors[`items[${index}].recommendVendor`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].recommendVendor`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{
                          errors[`items[${index}].recommendVendor`][0].message
                        }}
                      </Message>
                    </div>

                    <div class="field stagger-12">
                      <label>Remark<span class="req">*</span></label>
                      <textarea
                        v-model="item.remark"
                        @input="clearError(index, 'remark')"
                        class="inp inp-textarea"
                        maxlength="500"
                        rows="3"
                        placeholder="Additional remarks..."
                        :class="{
                          'inp-error': errors[`items[${index}].remark`],
                        }"
                      />
                      <Message
                        v-if="errors[`items[${index}].remark`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].remark`][0].message }}
                      </Message>
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
                  :disabled="
                    (act.action === 'add' && items.length >= 50) || isSubmitting
                  "
                  @click="handleAction(act.action)"
                >
                  <span
                    v-if="
                      isSubmitting &&
                      (act.action === 'send' || act.action === 'accept')
                    "
                  >
                    <i class="pi pi-spin pi-spinner" style="font-size: 12px" />
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

select.inp {
  height: 37px;
  padding: 0 11px;
  appearance: none;
  -webkit-appearance: none;

  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
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
  height: 37px;
  display: flex;
  align-items: center;
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

.inp-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15) !important;
}

.req {
  color: #f87171;
  margin-left: 2px;
}

:deep(.p-message.p-message-error) {
  background: transparent;
  border: none;
  padding: 2px 0 0;
  color: #f87171;
  font-size: 11px;
}

/* แต่ละปุ่มแดง */
.attach-btn-error {
  border-color: rgba(239, 68, 68, 0.6) !important;
  color: #f87171 !important;
  background: rgba(239, 68, 68, 0.08) !important;
}

/* แนบไฟล์แล้ว — เขียว */
.attach-btn-done {
  border-color: rgba(16, 185, 129, 0.5) !important;
  color: #34d399 !important;
  background: rgba(16, 185, 129, 0.08) !important;
  border-style: solid !important;
}

/* ครอบ label + ปุ่มลบ */
.attach-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.attach-wrap .attach-btn {
  flex: 1;
  /* ✅ เพิ่ม padding-right เผื่อปุ่มลบ */
  padding-right: 28px;
  overflow: hidden;
}

.attach-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* ปุ่ม ✕ */
.attach-remove {
  position: absolute;
  right: 6px;
  top: 45%;
  transform: translateY(-50%);
  width: 18px;
  height: 30px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid transparent;
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s;
  flex-shrink: 0;
  z-index: 1;
}
.attach-remove:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
  color: #fff;
}

/* Override PrimeVue Select ให้เข้า theme */
:deep(.gl-select) {
  width: 100%;
}
:deep(.gl-select .p-select) {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.09));
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-size: 13px;
}
:deep(.gl-select.inp-error-select .p-select) {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
}
:deep(.p-select-overlay) {
  background: var(--bg-base, #0d1428);
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.3));
  border-radius: 10px;
}
:deep(.p-select-filter) {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-subtle);
  border-radius: 7px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  padding: 7px 10px;
  width: 100%;
}
:deep(.p-select-option:hover) {
  background: var(--accent-dim, rgba(56, 163, 245, 0.12));
}
:deep(.p-select-option.p-selected) {
  background: var(--accent-dim, rgba(56, 163, 245, 0.2));
  color: var(--accent, #38a3f5);
}

/* GL option layout */
.gl-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
}
.gl-code {
  font-family: "DM Mono", monospace;
  font-size: 11.5px;
  color: var(--accent, #38a3f5);
  font-weight: 600;
  min-width: 80px;
  flex-shrink: 0;
}
.gl-desc {
  font-size: 12.5px;
  color: var(--text-primary, #fff);
}
.gl-placeholder {
  color: var(--text-muted, rgba(255, 255, 255, 0.3));
  font-size: 13px;
}

.field-error {
  font-size: 11px;
  color: #f87171;
  margin: 3px 0 0;
  padding: 0;
}
</style>
