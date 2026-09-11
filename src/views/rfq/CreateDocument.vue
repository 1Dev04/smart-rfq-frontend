<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { useAuthStore } from "../../stores/auth";
import DatePicker from "primevue/datepicker";
import Select from "primevue/select";
import { apiFetch } from "../../utils/api";
import Message from "primevue/message";
import InputText from "primevue/inputtext";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const drawer = useRFQDrawerStore();
const toast = useToast();
const auth = useAuthStore();
const isSubmitting = ref(false);
const category = computed(() => drawer.category);
const BASE = `${import.meta.env.VITE_API_URL}`;

const categoryTypeMap = {
  "project-revenue": "Project Revenue (I/O)",
  "lpg": "LPG 5Years & Yearly Insp",
  "calibration": "Calibration Gas Detector",
  "project-expense": "Project Expense (I/O)",
  "trading-cylinder": "Trading Gas Cylinder, Trading other",
  "trading-bulk": "Trading Gas Bulk",
  "fix-asset-cylinder": "Fix Asset Gas Cylinder",
  "expense": "Expense",
  "spare-parts": "Spare parts & Equipment For Gas",
  "fix-asset": "Fix Asset",
};

const categoryUomMap = [
  { label: "ชิ้น (Piece)", value: "PC" },
  { label: "ชุด (Set)", value: "SET" },
  { label: "กิโลกรัม (Kilogram)", value: "KG" },
  { label: "ลิตร (Liter)", value: "L" },
  { label: "พาเลท (Pallet)", value: "PAL" },
  { label: "กระป๋อง (Can)", value: "CAN" },
  { label: "ถังบรรจุ (Cylinder)", value: "CYL" },
  { label: "กล่อง (Box)", value: "BOX" },
  { label: "ม้วน (Roll)", value: "ROL" },
  { label: "งาน/โครงการ (Job)", value: "JOB" },
  { label: "ถัง/แท็งก์ (Tank)", value: "TAN" },
  { label: "เดือน (Month)", value: "MON" },
  { label: "คู่ (Pair)", value: "PAA" },
  { label: "แพ็ค/ห่อ (Pack)", value: "PAC" },
  { label: "รีม (Ream)", value: "REA" },
  { label: "ปี (Year)", value: "YR" },
];

const categoryPurposeMap = [
  { label: "Budget Plan (สำหรับวางแผน)", value: "budget" },
  { label: "Price Compare (ต้องการซื้อจริง)", value: "compare" },
  { label: "Bidding (เสนอขาย)", value: "bidding" },
];

const runningNum = ref(5);

const rfqNumber = computed(() => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const xxx = String(runningNum.value).padStart(3, "0");
  return `EN-${yy}${mm}${xxx}`;
});

const prefilledType = computed(() =>
  category.value ? (categoryTypeMap[category.value.id] ?? "") : "",
);

const prefilledUom = computed(() =>
  category.value ? (categoryUomMap[category.value.id] ?? "") : "",
);

const prefilledPurpose = computed(() =>
  category.value ? (categoryPurposeMap[category.value.id] ?? "") : "",
);

const isTypeLocked = computed(() => !!prefilledType.value);


/* ── Category data ── */
const typeCodeKeyMap = ref([
  {
    ids: "project-revenue",
    codes: [
      { code: "PS", descKey: "codes.desc-project-revenue" }
    ]
  },
  {
    ids: "lpg",
    codes: [
      { code: "PS", descKey: "codes.desc-lpg-5year" }
    ]
  },
  {
    ids: "calibration",
    codes: [
      { code: "SE", descKey: "codes.desc-service-charge" }
    ]
  },
  {
    ids: "project-expense",
    codes: [
      { code: "SE", descKey: "codes.desc-service-charge" },
      { code: "PM", descKey: "codes.desc-pm" }
    ]
  },
  {
    ids: "trading-cylinder",
    codes: [
      { code: "TC", descKey: "codes.desc-trading-gas-cylinder" }
    ]
  },
  {
    ids: "trading-bulk",
    codes: [
      { code: "TB", descKey: "codes.desc-trading-gas-bulk" }
    ]
  },
  {
    ids: "fix-asset-cylinder",
    codes: [
      { code: "AC", descKey: "codes.desc-fixed-asset-gas" }
    ]
  },
  {
    ids: "expense",
    codes: [
      { code: "SE", descKey: "codes.desc-service-charge" },
      { code: "EX", descKey: "codes.desc-expense-general" }
    ]
  },
  {
    ids: "spare-parts",
    codes: [
      { code: "CS", descKey: "codes.desc-central-store" }
    ]
  },
  {
    ids: "fix-asset",
    codes: [
      { code: "FA", descKey: "codes.desc-fixed-asset-specified" }
    ]
  },
]);

// ── Field open/close config by Type ──────────────────────────
const typeLabelToId = Object.fromEntries(
  Object.entries(categoryTypeMap).map(([id, label]) => [label, id]),
);

function getCodesForType(typeId) {
  if (!typeId) return [];
  const entry = typeCodeKeyMap.value.find((c) => c.ids === typeId);
  return entry ? entry.codes : [];
}

function typeCodeHint(item) {
  const typeId = typeLabelToId[item.type];
  const codes = getCodesForType(typeId);

  if (!codes.length) return "";

  return  codes.map((c) => `[${c.code}] · ${t(c.descKey)} `).join(`                                 `);
}


const OPEN_FIELDS_BY_TYPE = {
  "project-revenue": [
    "projectName",
    "glCode",
    "itemDescription",
    "quantity",
    "uom",
    "customer",
    "addressLocation",
  ],
  lpg: [
    "projectName",
    "glCode",
    "itemDescription",
    "quantity",
    "uom",
    "customer",
    "addressLocation",
  ],
  calibration: [
    "projectName",
    "glCode",
    "itemDescription",
    "model",
    "brand",
    "forGas",
    "quantity",
    "uom",
    "customer",
    "addressLocation",
  ],
  "project-expense": [
    "projectName",
    "glCode",
    "itemDescription",
    "quantity",
    "uom",
    "customer",
    "addressLocation",
  ],
  "trading-cylinder": [
    "sapItem",
    "itemDescription",
    "specPurity",
    "cylinderType",
    "quantity",
    "uom",
    "cylinderSize",
    "makerSource",
    "requiredValve",
    "purposeApplication",
    "customer",
    "addressLocation",
  ],
  "trading-bulk": [
    "itemDescription",
    "specPurity",
    "cylinderType",
    "quantity",
    "uom",
    "cylinderSize",
    "makerSource",
    "requiredValve",
    "purposeApplication",
    "customer",
    "addressLocation",
  ],
  "fix-asset-cylinder": [
    "sapItem",
    "itemDescription",
    "specPurity",
    "cylinderType",
    "quantity",
    "uom",
    "cylinderSize",
    "makerSource",
    "requiredValve",
    "purposeApplication",
    "customer",
    "addressLocation",
  ],
  expense: [
    "glCode",
    "sapItem",
    "itemDescription",
    "specPartNo",
    "model",
    "brand",
    "quantity",
    "uom",
    "purposeApplication",
  ],
  "spare-parts": [
    "glCode",
    "sapItem",
    "itemDescription",
    "specPartNo",
    "model",
    "brand",
    "forGas",
    "quantity",
    "uom",
    "purposeApplication",
  ],
  "fix-asset": [
    "sapItem",
    "itemDescription",
    "specPartNo",
    "quantity",
    "uom",
    "purposeApplication",
  ],
};

const ALWAYS_OPEN_FIELDS = ["itemDescription", "quantity", "uom"];

function isFieldOpen(item, field) {
  if (ALWAYS_OPEN_FIELDS.includes(field)) return true;
  const typeId = typeLabelToId[item.type];
  if (!typeId) return false;
  const openList = OPEN_FIELDS_BY_TYPE[typeId];
  if (!openList) return true;
  return openList.includes(field);
}


function clearClosedFields(item) {
  Object.keys(createEmptyItem()).forEach((field) => {
    if (
      [
        "projectName",
        "glCode",
        "sapItem",
        "itemDescription",
        "specPartNo",
        "model",
        "brand",
        "forGas",
        "specPurity",
        "cylinderType",
        "cylinderSize",
        "makerSource",
        "requiredValve",
        "purposeApplication",
        "customer",
        "addressLocation",
      ].includes(field) &&
      !isFieldOpen(item, field)
    ) {
      item[field] = "";
    }
  });
}

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

watch(
  prefilledUom,
  (val) => {
    if (val && items.value.length > 0) {
      items.value[0].uom = val;
    }
  },
  { immediate: true },
);

watch(
  prefilledPurpose,
  (val) => {
    if (val && items.value.length > 0) {
      items.value[0].uom = val;
    }
  },
  { immediate: true },
);

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

// ── Patterns ──────────────────────────────────────────────────
const PATTERNS = {
  brand: /^[a-zA-Z0-9\s\-&.,()]+$/,
  forGas: /^[a-zA-Z0-9ก-๙\s\-/()%.,]+$/,
  specPurity: /^[a-zA-Z0-9ก-๙\s%./\-(),]+$/,
  cylinderType: /^[a-zA-Z0-9ก-๙\s%./\-(),]+$/,
  uom: /^[a-zA-Z0-9/]+$/,
  cylinderSize: /^\d+(\.\d+)?$/,
  makerSource: /^[a-zA-Z0-9\s\-/&.,()]+$/,
  requiredValve: /^[a-zA-Z0-9\s\-/(),']+$/,
  noWeirdChars: /^[^@~#$^`*]+$/,
  customer: /^[a-zA-Z0-9ก-๙\s\-.(),&']+$/,
  recommendVendor: /^[a-zA-Z0-9ก-๙\s\-/&.,()]+$/,
  projectName: /^[a-zA-Z0-9ก-๙\s\-/&.,()_#]+$/,
  specPartNo: /^[a-zA-Z0-9\s\-/&.,()_#]+$/,
  model: /^[a-zA-Z0-9\s\-/&.,()_#+N/A]+$/,
  remark: /^[^@~$^`]+$/,
};

const items = ref([createEmptyItem()]);

// ── Reset entire form ──────────────────────────────────────────
function resetForm() {
  items.value = [createEmptyItem()];
  errors.value = {};
  fileInputRefs.value = {};
  // re-apply prefilledType/Uom
  if (prefilledType.value) items.value[0].type = prefilledType.value;
  if (prefilledUom.value) items.value[0].uom = prefilledUom.value;
}

function addItem() {
  if (items.value.length < 50) {
    const newItem = createEmptyItem();
    if (prefilledType.value) newItem.type = prefilledType.value;
    if (prefilledUom.value) newItem.uom = prefilledUom.value;
    items.value.push(newItem);
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
  clearError(idx, field);
  clearError(idx, "attachDWG"); // clear group error
}

function removeFile(item, field) {
  const idx = items.value.indexOf(item);
  item[field] = null;
  const refKey = `${idx}_${field}`;
  if (fileInputRefs.value[refKey]) {
    fileInputRefs.value[refKey].value = "";
  }
}

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

function toLocalDateString(date) {
  if (!(date instanceof Date)) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function handleAction(action) {
  if (!validate()) {
    toast.add({
      severity: "warn",
      summary: "กรุณากรอกข้อมูลให้ครบ",
      detail: "มีบางช่องที่ยังไม่ได้กรอก",
      life: 4000,
    });
    return;
  }

  if (action === "cancel") {
    drawer.closeDrawer();
    return;
  }

  if (action === "draft") {
    isSubmitting.value = true;
    try {
      const formData = new FormData();
      const appendIf = (key, value) => {
        const v = value ?? "";
        if (v !== "") formData.append(key, v);
      };

      items.value.forEach((item, i) => {
        (formData.append(
          `items[${i}].TargetPURreply`,
          item.targetPURreply instanceof Date
            ? toLocalDateString(item.targetPURreply)
            : (item.targetPURreply ?? ""),
        ),
          appendIf(`items[${i}].Type`, item.type));
        appendIf(`items[${i}].Quantity`, item.quantity);
        appendIf(`items[${i}].Uom`, item.uom);
        appendIf(`items[${i}].ProjectName`, item.projectName);
        appendIf(`items[${i}].GlCode`, item.glCode);
        appendIf(`items[${i}].SapItem`, item.sapItem);
        appendIf(`items[${i}].ItemDescription`, item.itemDescription);
        appendIf(`items[${i}].SpecPartNo`, item.specPartNo);
        appendIf(`items[${i}].Model`, item.model);
        appendIf(`items[${i}].Brand`, item.brand);
        appendIf(`items[${i}].ForGas`, item.forGas);
        appendIf(`items[${i}].SpecPurity`, item.specPurity);
        appendIf(`items[${i}].CylinderType`, item.cylinderType);
        appendIf(`items[${i}].CylinderSize`, item.cylinderSize);
        appendIf(`items[${i}].MakerSource`, item.makerSource);
        appendIf(`items[${i}].RequiredValve`, item.requiredValve);
        appendIf(`items[${i}].PurposeApplication`, item.purposeApplication);
        appendIf(`items[${i}].Customer`, item.customer);
        appendIf(`items[${i}].AddressLocation`, item.addressLocation);
        appendIf(`items[${i}].RecommendVendor`, item.recommendVendor);
        appendIf(`items[${i}].Remark`, item.remark);

        if (item.attachDWG)
          formData.append(`items[${i}].AttachDWG`, item.attachDWG);
        if (item.attachSpec)
          formData.append(`items[${i}].AttachSpec`, item.attachSpec);
        if (item.attachQuotation)
          formData.append(`items[${i}].AttachQuotation`, item.attachQuotation);
        if (item.attachEtc)
          formData.append(`items[${i}].AttachEtc`, item.attachEtc);
      });

      const res = await apiFetch(`${BASE}/api/doc-request/save-draft`, {
        method: "POST",
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
          summary: "Save draft failed",
          detail: body.message ?? `Server error (HTTP ${res.status})`,
          closable: true,
          life: 6000,
        });
        return;
      }
      toast.add({
        severity: "info",
        summary: "Draft saved",
        detail: "บันทึกร่างเรียบร้อยแล้ว สามารถกลับมาแก้ไขต่อได้ภายหลัง",
        closable: true,
        life: 4000,
      });
      resetForm();
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
      resetForm();
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

  // ── Send (User only) ──────────────────────────────────────
  if (action === "send") {
    isSubmitting.value = true;

    try {
      const formData = new FormData();
      const appendIf = (key, value) => {
        const v = value ?? "";
        if (v !== "") formData.append(key, v);
      };

      items.value.forEach((item, i) => {
        formData.append(
          `items[${i}].TargetPURreply`,
          item.targetPURreply instanceof Date
            ? toLocalDateString(item.targetPURreply)
            : (item.targetPURreply ?? ""),
        );
     
        formData.append(`items[${i}].Type`, item.type ?? "");
        formData.append(`items[${i}].Quantity`, item.quantity ?? "");
        formData.append(`items[${i}].Uom`, item.uom ?? "");

       
        appendIf(`items[${i}].ProjectName`, item.projectName);
        appendIf(`items[${i}].GlCode`, item.glCode);
        appendIf(`items[${i}].SapItem`, item.sapItem);
        appendIf(`items[${i}].ItemDescription`, item.itemDescription);
        appendIf(`items[${i}].SpecPartNo`, item.specPartNo);
        appendIf(`items[${i}].Model`, item.model);
        appendIf(`items[${i}].Brand`, item.brand);
        appendIf(`items[${i}].ForGas`, item.forGas);
        appendIf(`items[${i}].SpecPurity`, item.specPurity);
        appendIf(`items[${i}].CylinderType`, item.cylinderType);
        appendIf(`items[${i}].CylinderSize`, item.cylinderSize);
        appendIf(`items[${i}].MakerSource`, item.makerSource);
        appendIf(`items[${i}].RequiredValve`, item.requiredValve);
        appendIf(`items[${i}].PurposeApplication`, item.purposeApplication);
        appendIf(`items[${i}].Customer`, item.customer);
        appendIf(`items[${i}].AddressLocation`, item.addressLocation);
        appendIf(`items[${i}].RecommendVendor`, item.recommendVendor);
        appendIf(`items[${i}].Remark`, item.remark);

        if (item.attachDWG)
          formData.append(`items[${i}].AttachDWG`, item.attachDWG);
        if (item.attachSpec)
          formData.append(`items[${i}].AttachSpec`, item.attachSpec);
        if (item.attachQuotation)
          formData.append(`items[${i}].AttachQuotation`, item.attachQuotation);
        if (item.attachEtc)
          formData.append(`items[${i}].AttachEtc`, item.attachEtc);
      });
      const res = await apiFetch(`${BASE}/api/doc-request/create`, {
        method: "POST",
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
      resetForm(); 
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

  // ── Accept (Purchase only) ────────────────────────────────
  if (action === "accept") {
    isSubmitting.value = true;
    try {
      const res = await apiFetch(`${BASE}/api/doc-request/accept`, {
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
      resetForm();
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

// ── SAP Options ───────────────────────────────────────────────
const sapItemOptions = ref([]);
const isLoadingSapItems = ref(false);

async function fetchSapItems() {
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

// ── Validation resolver ──────────────────────────────────────

const resolver = ({ values }) => {
  const errors = {};

  values.items?.forEach((item, i) => {
  
    if (!item.targetPURreply)
      errors[`items[${i}].targetPURreply`] = [
        { message: "กรุณาเลือก Target PUR Reply" },
      ];

    if (item.projectName?.trim()) {
      if (item.projectName.trim().length > 150)
        errors[`items[${i}].projectName`] = [
          { message: "Project Name ต้องไม่เกิน 150 ตัวอักษร" },
        ];
      else if (!PATTERNS.projectName.test(item.projectName.trim()))
        errors[`items[${i}].projectName`] = [
          { message: "Project Name มีอักขระที่ไม่อนุญาต (@ ~ # $ ^ `)" },
        ];
    }

    // ── GL Code (optional) ── ข้ามไป
    // ── SAP Item (optional) ── ข้ามไป

    // ── Item Description (optional, validate if filled) ──
    if (item.itemDescription?.trim().length > 500)
      errors[`items[${i}].itemDescription`] = [
        { message: "Item Description ต้องไม่เกิน 500 ตัวอักษร" },
      ];
    else if (
      item.itemDescription?.trim() &&
      !PATTERNS.noWeirdChars.test(item.itemDescription.trim())
    )
      errors[`items[${i}].itemDescription`] = [
        { message: "Item Description มีอักขระที่ไม่อนุญาต (@ ~ # $ ^ `)" },
      ];

    // ── Spec / Part No. (optional, validate if filled) ──
    if (item.specPartNo?.trim()) {
      if (item.specPartNo.trim().length > 200)
        errors[`items[${i}].specPartNo`] = [
          { message: "Spec / Part No. ต้องไม่เกิน 200 ตัวอักษร" },
        ];
      else if (!PATTERNS.specPartNo.test(item.specPartNo.trim()))
        errors[`items[${i}].specPartNo`] = [
          { message: "Spec / Part No. มีอักขระที่ไม่อนุญาต" },
        ];
    }

    // ── Model (optional, validate if filled) ──
    if (item.model?.trim().length > 100)
      errors[`items[${i}].model`] = [
        { message: "Model ต้องไม่เกิน 100 ตัวอักษร" },
      ];

    // ── Brand (optional, validate if filled) ──
    if (item.brand?.trim()) {
      if (item.brand.trim().length > 100)
        errors[`items[${i}].brand`] = [
          { message: "Brand ต้องไม่เกิน 100 ตัวอักษร" },
        ];
      else if (!PATTERNS.brand.test(item.brand.trim()))
        errors[`items[${i}].brand`] = [
          { message: "Brand ใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข และ - & . , ( )" },
        ];
    }

    // ── For GAS (optional, validate if filled) ──
    if (item.forGas?.trim()) {
      if (item.forGas.trim().length > 100)
        errors[`items[${i}].forGas`] = [
          { message: "For GAS ต้องไม่เกิน 100 ตัวอักษร" },
        ];
      else if (!PATTERNS.forGas.test(item.forGas.trim()))
        errors[`items[${i}].forGas`] = [
          { message: "For GAS มีอักขระที่ไม่อนุญาต (@ ~ # $ ^ `)" },
        ];
    }

    // ── Attachments (at least 1 required) ──
    if (
      !item.attachDWG &&
      !item.attachSpec &&
      !item.attachQuotation &&
      !item.attachEtc
    )
      errors[`items[${i}].attachDWG`] = [
        { message: "กรุณาแนบไฟล์ DWG หรือ Specification อย่างน้อย 1 ไฟล์" },
      ];

    // ── Type (required) ──
    if (!item.type)
      errors[`items[${i}].type`] = [{ message: "กรุณาเลือก Type" }];

    // ── Spec / Purity (optional, validate if filled) ──
    if (item.specPurity?.trim()) {
      if (item.specPurity.trim().length > 100)
        errors[`items[${i}].specPurity`] = [
          { message: "Spec / Purity ต้องไม่เกิน 100 ตัวอักษร" },
        ];
      else if (!PATTERNS.specPurity.test(item.specPurity.trim()))
        errors[`items[${i}].specPurity`] = [
          { message: "Spec / Purity มีอักขระที่ไม่อนุญาต" },
        ];
    }

    // ── Cylinder Type (optional, validate if filled) ──
    if (item.cylinderType?.trim()) {
      if (item.cylinderType.trim().length > 100)
        errors[`items[${i}].cylinderType`] = [
          { message: "Cylinder Type ต้องไม่เกิน 100 ตัวอักษร" },
        ];
      else if (!PATTERNS.cylinderType.test(item.cylinderType.trim()))
        errors[`items[${i}].cylinderType`] = [
          { message: "Cylinder Type มีอักขระที่ไม่อนุญาต" },
        ];
    }

    // ── Quantity (required) ──
    if (
      !item.quantity ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) <= 0
    )
      errors[`items[${i}].quantity`] = [
        { message: "กรุณากรอก Quantity เป็นจำนวนเต็มและมากกว่า 0" },
      ];

    // ── UOM (required) ──
    if (!item.uom?.trim())
      errors[`items[${i}].uom`] = [{ message: "กรุณาเลือก UOM" }];

    // ── Cylinder Size (optional, validate if filled) ──
    if (item.cylinderSize?.trim()) {
      if (!PATTERNS.cylinderSize.test(item.cylinderSize.trim()))
        errors[`items[${i}].cylinderSize`] = [
          { message: "Cylinder Size ต้องเป็นตัวเลขเท่านั้น เช่น 50 หรือ 47.5" },
        ];
    }

    // ── Maker / Source (optional, validate if filled) ──
    if (item.makerSource?.trim()) {
      if (item.makerSource.trim().length > 150)
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
    }

    // ── Required Valve (optional, validate if filled) ──
    if (item.requiredValve?.trim()) {
      if (item.requiredValve.trim().length > 100)
        errors[`items[${i}].requiredValve`] = [
          { message: "Required Valve ต้องไม่เกิน 100 ตัวอักษร" },
        ];
      else if (!PATTERNS.requiredValve.test(item.requiredValve.trim()))
        errors[`items[${i}].requiredValve`] = [
          { message: "Required Valve มีอักขระที่ไม่อนุญาต" },
        ];
    }

    // ── Purpose / Application (optional, validate if filled) ──
    if (item.purposeApplication?.trim()) {
      if (item.purposeApplication.trim().length > 300)
        errors[`items[${i}].purposeApplication`] = [
          { message: "Purpose / Application ต้องไม่เกิน 300 ตัวอักษร" },
        ];
      else if (!PATTERNS.noWeirdChars.test(item.purposeApplication.trim()))
        errors[`items[${i}].purposeApplication`] = [
          { message: "มีอักขระที่ไม่อนุญาต (@ ~ # $ ^ `)" },
        ];
    }

    // ── Customer (optional, validate if filled) ──
    if (item.customer?.trim()) {
      if (item.customer.trim().length > 150)
        errors[`items[${i}].customer`] = [
          { message: "Customer ต้องไม่เกิน 150 ตัวอักษร" },
        ];
      else if (!PATTERNS.customer.test(item.customer.trim()))
        errors[`items[${i}].customer`] = [
          { message: "Customer มีอักขระที่ไม่อนุญาต" },
        ];
    }

    // ── Address / Location (optional, validate if filled) ──
    if (item.addressLocation?.trim()) {
      if (item.addressLocation.trim().length > 300)
        errors[`items[${i}].addressLocation`] = [
          { message: "Address ต้องไม่เกิน 300 ตัวอักษร" },
        ];
      else if (!PATTERNS.noWeirdChars.test(item.addressLocation.trim()))
        errors[`items[${i}].addressLocation`] = [
          { message: "Address มีอักขระที่ไม่อนุญาต (@ ~ # $ ^ `)" },
        ];
    }

    // ── Recommend Vendor (optional, validate if filled) ──
    if (item.recommendVendor?.trim()) {
      if (item.recommendVendor.trim().length > 200)
        errors[`items[${i}].recommendVendor`] = [
          { message: "Recommend Vendor ต้องไม่เกิน 200 ตัวอักษร" },
        ];
      else if (!PATTERNS.recommendVendor.test(item.recommendVendor.trim()))
        errors[`items[${i}].recommendVendor`] = [
          { message: "Recommend Vendor มีอักขระที่ไม่อนุญาต" },
        ];
    }

    // ── Remark (optional, validate if filled) ──
    if (item.remark?.trim()) {
      if (item.remark.trim().length > 500)
        errors[`items[${i}].remark`] = [
          { message: "Remark ต้องไม่เกิน 500 ตัวอักษร" },
        ];
      else if (!PATTERNS.remark.test(item.remark.trim()))
        errors[`items[${i}].remark`] = [
          { message: "Remark มีอักขระที่ไม่อนุญาต (@ ~ $ ^ `)" },
        ];
    }
  });

  return { errors };
};

function closeDrawer() {
  resetForm();
  drawer.closeDrawer();
}

function onTypeChange(item, index) {
  clearError(index, "type");
  clearClosedFields(item);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="
          drawer.showDrawer &&
          drawer.drawerRole === 'user' &&
          !drawer.docRequestId
        "
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
                        : "Fill Data"
                    }}
                  </h2>
                  <span class="dh-sub">
                    · {{ items.length }} Item{{ items.length > 1 ? "s" : "" }}
                  </span>
                </div>
              </div>
              <button
                class="dh-close"
                @click="closeDrawer()"
                aria-label="Close"
              >
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

                <div v-if="!item.type" class="type-lock-hint">
                  <i class="pi pi-lock" style="font-size: 12px">
                    กรุณาเลือก Type ก่อน เพื่อปลดล็อกช่องกรอกข้อมูลที่เกี่ยวข้อง
                  </i>
                </div>

                <div class="form-grid">
                  <!-- ══ LEFT COL: General Info ══ -->
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
                        <div class="inp-auto">{{ rfqNumber }}</div>
                      </div>
                      <div class="field field-auto">
                        <label>Rev. No.</label>
                        <div class="inp-auto">Rev.00</div>
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

                    <div
                      class="field stagger-4"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'projectName'),
                      }"
                    >
                      <label>Project Name</label>
                      <input
                        v-model="item.projectName"
                        @input="clearError(index, 'projectName')"
                        type="text"
                        class="inp"
                        maxlength="150"
                        placeholder="Enter project name"
                        :disabled="!isFieldOpen(item, 'projectName')"
                        :class="{
                          'inp-error': errors[`items[${index}].projectName`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Project Name</span
                      >
                      <Message
                        v-if="errors[`items[${index}].projectName`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].projectName`][0].message }}
                      </Message>
                    </div>

                    <div
                      class="field stagger-5"
                      :class="{ 'field-closed': !isFieldOpen(item, 'glCode') }"
                    >
                      <label>GL Code</label>
                      <Select
                        v-model="item.glCode"
                        @update:modelValue="clearError(index, 'glCode')"
                        :options="glCodeOptions"
                        optionLabel="code"
                        optionValue="code"
                        :disabled="!isFieldOpen(item, 'glCode')"
                        :placeholder="
                          isLoadingGlCodes
                            ? 'กำลังโหลด...'
                            : '— Select GL Code —'
                        "
                        :loading="isLoadingGlCodes"
                        filter
                        filterBy="code,description"
                        filterPlaceholder="Search GL Code..."
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
                          <span v-if="value"
                            >{{ value }} ·
                            {{
                              glCodeOptions.find((g) => g.code === value)
                                ?.description
                            }}</span
                          >
                          <span v-else class="gl-placeholder"
                            >— Select GL Code —</span
                          >
                        </template>
                      </Select>
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มีใน GL Code</span
                      >
                    </div>

                    <div
                      class="field stagger-6"
                      :class="{ 'field-closed': !isFieldOpen(item, 'sapItem') }"
                    >
                      <label>SAP Item No.</label>
                      <Select
                        v-model="item.sapItem"
                        @update:modelValue="clearError(index, 'sapItem')"
                        :options="sapItemOptions"
                        optionLabel="code"
                        optionValue="code"
                        :disabled="!isFieldOpen(item, 'sapItem')"
                        :placeholder="
                          isLoadingSapItems
                            ? 'กำลังโหลด...'
                            : '— Select SAP Item —'
                        "
                        :loading="isLoadingSapItems"
                        filter
                        filterBy="code,description"
                        filterPlaceholder="Search SAP Item..."
                        showClear
                        class="gl-select"
                        :pt="{ root: { style: 'width: 100%' } }"
                        @filter="(e) => (e.value = e.value.replace(/\D/g, ''))"
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
                          <span v-if="value"
                            >{{ value }} ·
                            {{
                              sapItemOptions.find((s) => s.code === value)
                                ?.description
                            }}</span
                          >
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
                      <label>Item Description</label>
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
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Description</span
                      >
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

                    <div
                      class="field stagger-8"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'specPartNo'),
                      }"
                    >
                      <label>Specification / Part No.</label>
                      <input
                        v-model="item.specPartNo"
                        @input="clearError(index, 'specPartNo')"
                        type="text"
                        class="inp"
                        maxlength="200"
                        placeholder="Spec or part number"
                        :disabled="!isFieldOpen(item, 'specPartNo')"
                        :class="{
                          'inp-error': errors[`items[${index}].specPartNo`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Spec / Part
                        No.</span
                      >
                      <Message
                        v-if="errors[`items[${index}].specPartNo`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].specPartNo`][0].message }}
                      </Message>
                    </div>

                    <div
                      class="field stagger-9"
                      :class="{ 'field-closed': !isFieldOpen(item, 'model') }"
                    >
                      <label>Model</label>
                      <input
                        v-model="item.model"
                        type="text"
                        class="inp"
                        maxlength="100"
                        placeholder="Fix Model or N/A"
                        :disabled="!isFieldOpen(item, 'model')"
                      />
                      <span class="field-hint"
                        >กรณีไม่มี Fix Model สามารถใส่ N/A ได้</span
                      >
                      <Message
                        v-if="errors[`items[${index}].model`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].model`][0].message }}
                      </Message>
                    </div>

                    <div class="field-row stagger-10">
                      <div
                        class="field"
                        :class="{ 'field-closed': !isFieldOpen(item, 'brand') }"
                      >
                        <label>Brand</label>
                        <input
                          v-model="item.brand"
                          @input="clearError(index, 'brand')"
                          type="text"
                          class="inp"
                          maxlength="100"
                          placeholder="Brand name"
                          :disabled="!isFieldOpen(item, 'brand')"
                          :class="{
                            'inp-error': errors[`items[${index}].brand`],
                          }"
                        />
                        <span class="field-hint"
                          >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Brand</span
                        >
                        <Message
                          v-if="errors[`items[${index}].brand`]"
                          severity="error"
                          size="small"
                          variant="simple"
                        >
                          {{ errors[`items[${index}].brand`][0].message }}
                        </Message>
                      </div>
                      <div
                        class="field"
                        :class="{
                          'field-closed': !isFieldOpen(item, 'forGas'),
                        }"
                      >
                        <label>For GAS</label>
                        <input
                          v-model="item.forGas"
                          @input="clearError(index, 'forGas')"
                          type="text"
                          class="inp"
                          maxlength="100"
                          placeholder="Gas type"
                          :disabled="!isFieldOpen(item, 'forGas')"
                          :class="{
                            'inp-error': errors[`items[${index}].forGas`],
                          }"
                        />
                        <span class="field-hint"
                          >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี For GAS</span
                        >
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
                              !item.attachDWG &&
                              !item.attachSpec &&
                              !item.attachQuotation &&
                              !item.attachEtc,
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
                      <Message
                        v-if="errors[`items[${index}].attachDWG`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].attachDWG`][0].message }}
                      </Message>
                    </div>

                    <!-- ✅ แสดง email จาก auth store -->
                    <div class="field stagger-12">
                      <label>User / Engineer / Sale</label>
                      <div class="inp-auto inp-auto--email">
                        <i
                          class="pi pi-user"
                          style="font-size: 11px; opacity: 0.6"
                        ></i>
                        {{ auth.user?.email ?? "—" }}
                      </div>
                    </div>
                  </div>

                  <div class="col-divider" />

                  <!-- ══ RIGHT COL: Product Specification ══ -->
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
                        <div class="inp-auto">
                          {{
                            new Date().toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })
                          }}
                        </div>
                      </div>
                      <div class="field">
                        <label>
                          Type <span class="req">*</span>
                          <i
                            v-if="typeCodeHint(item)"
                            class="pi pi-question-circle type-hint-icon"
                            :title="typeCodeHint(item)"
                          ></i>
                        </label>

                        <!-- Locked: ใช้ logic เดิม ไม่เกี่ยวกับ code hint -->
                        <div
                          v-if="isTypeLocked"
                          class="inp-auto inp-auto--locked"
                        >
                          <i
                            class="pi pi-lock"
                            style="font-size: 11px; opacity: 0.7"
                          ></i>
                          {{ prefilledType }}
                        </div>

                        <!-- Unlocked fallback -->
                        <select
                          v-else
                          v-model="item.type"
                          @change="onTypeChange(item, index)"
                          class="inp"
                          :class="{
                            'inp-error': errors[`items[${index}].type`],
                          }"
                        >
                          <option value="">— Select Type —</option>
                          <option
                            v-for="t in categoryTypeMap"
                            :key="t"
                            :value="t"
                          >
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

                    <div
                      class="field stagger-2"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'specPurity'),
                      }"
                    >
                      <label>Specification / Purity</label>
                      <input
                        v-model="item.specPurity"
                        @input="clearError(index, 'specPurity')"
                        type="text"
                        class="inp"
                        maxlength="100"
                        placeholder="e.g. 99.999%"
                        :disabled="!isFieldOpen(item, 'specPurity')"
                        :class="{
                          'inp-error': errors[`items[${index}].specPurity`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Spec / Purity</span
                      >
                      <Message
                        v-if="errors[`items[${index}].specPurity`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].specPurity`][0].message }}
                      </Message>
                    </div>

                    <div
                      class="field stagger-3"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'cylinderType'),
                      }"
                    >
                      <label>Cylinder Type</label>
                      <input
                        v-model="item.cylinderType"
                        @input="clearError(index, 'cylinderType')"
                        type="text"
                        class="inp"
                        maxlength="100"
                        placeholder="Cylinder type"
                        :disabled="!isFieldOpen(item, 'cylinderType')"
                        :class="{
                          'inp-error': errors[`items[${index}].cylinderType`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Cylinder type</span
                      >
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
                          placeholder="0"
                          min="1"
                          step="1"
                          :class="{
                            'inp-error': errors[`items[${index}].quantity`],
                          }"
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
                        <select
                          v-model="item.uom"
                          @change="clearError(index, 'uom')"
                          class="inp"
                          :class="{
                            'inp-error': errors[`items[${index}].uom`],
                          }"
                        >
                          <option value="">— Select Uom —</option>
                          <option
                            v-for="u in categoryUomMap"
                            :key="u.value"
                            :value="u.value"
                          >
                            {{ u.label }}
                          </option>
                        </select>
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

                    <div
                      class="field stagger-5"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'cylinderSize'),
                      }"
                    >
                      <label>Cylinder Size (L)</label>
                      <input
                        v-model="item.cylinderSize"
                        @input="clearError(index, 'cylinderSize')"
                        type="text"
                        class="inp"
                        maxlength="20"
                        placeholder="Size in litres"
                        :disabled="!isFieldOpen(item, 'cylinderSize')"
                        :class="{
                          'inp-error': errors[`items[${index}].cylinderSize`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Cylinder Size</span
                      >
                      <Message
                        v-if="errors[`items[${index}].cylinderSize`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].cylinderSize`][0].message }}
                      </Message>
                    </div>

                    <div
                      class="field stagger-6"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'makerSource'),
                      }"
                    >
                      <label>Maker / Source</label>
                      <input
                        v-model="item.makerSource"
                        @input="clearError(index, 'makerSource')"
                        type="text"
                        class="inp"
                        maxlength="150"
                        placeholder="Manufacturer or source"
                        :disabled="!isFieldOpen(item, 'makerSource')"
                        :class="{
                          'inp-error': errors[`items[${index}].makerSource`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Maker / Source</span
                      >
                      <Message
                        v-if="errors[`items[${index}].makerSource`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].makerSource`][0].message }}
                      </Message>
                    </div>

                    <div
                      class="field stagger-7"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'requiredValve'),
                      }"
                    >
                      <label>Required Type Valve</label>
                      <input
                        v-model="item.requiredValve"
                        @input="clearError(index, 'requiredValve')"
                        type="text"
                        class="inp"
                        maxlength="100"
                        placeholder="Valve type"
                        :disabled="!isFieldOpen(item, 'requiredValve')"
                        :class="{
                          'inp-error': errors[`items[${index}].requiredValve`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Required Valve</span
                      >
                      <Message
                        v-if="errors[`items[${index}].requiredValve`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].requiredValve`][0].message }}
                      </Message>
                    </div>

                    <div
                      class="field stagger-8"
                      :class="{
                        'field-closed': !isFieldOpen(
                          item,
                          'purposeApplication',
                        ),
                      }"
                    >
                      <label>Purpose / Application</label>

                      <select
                        v-model="item.purposeApplication"
                        @change="clearError(index, 'purposeApplication')"
                        class="inp"
                        :disabled="!isFieldOpen(item, 'purposeApplication')"
                        :class="{
                          'inp-error':
                            errors[`items[${index}].purposeApplication`],
                        }"
                      >
                        <option value="">— Select Purpose —</option>
                        <option
                          v-for="u in categoryPurposeMap"
                          :key="u.value"
                          :value="u.value"
                        >
                          {{ u.label }}
                        </option>
                      </select>
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Purpose /
                        Application</span
                      >
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

                    <div
                      class="field stagger-9"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'customer'),
                      }"
                    >
                      <label>Customer</label>
                      <input
                        v-model="item.customer"
                        @input="clearError(index, 'customer')"
                        type="text"
                        class="inp"
                        maxlength="150"
                        placeholder="Customer name"
                        :disabled="!isFieldOpen(item, 'customer')"
                        :class="{
                          'inp-error': errors[`items[${index}].customer`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Customer</span
                      >
                      <Message
                        v-if="errors[`items[${index}].customer`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].customer`][0].message }}
                      </Message>
                    </div>

                    <div
                      class="field stagger-10"
                      :class="{
                        'field-closed': !isFieldOpen(item, 'addressLocation'),
                      }"
                    >
                      <label>Address / Location</label>
                      <input
                        v-model="item.addressLocation"
                        @input="clearError(index, 'addressLocation')"
                        type="text"
                        class="inp"
                        maxlength="300"
                        placeholder="Delivery address"
                        :disabled="!isFieldOpen(item, 'addressLocation')"
                        :class="{
                          'inp-error':
                            errors[`items[${index}].addressLocation`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Address /
                        Location</span
                      >
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
                      <label>Recommend Vendor / Brand</label>
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
                      <span class="field-hint"
                        >ไม่บังคับ — เว้นว่างได้ถ้ายังไม่มี Recommend
                        Vendor</span
                      >
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
                      <label>Remark</label>
                      <textarea
                        v-model="item.remark"
                        @input="clearError(index, 'remark')"
                        class="inp inp-textarea"
                        maxlength="500"
                        rows="3"
                        placeholder="Additional remarks... (ไม่บังคับ)"
                        :class="{
                          'inp-error': errors[`items[${index}].remark`],
                        }"
                      />
                      <span class="field-hint"
                        >ไม่บังคับ — ถ้ากรอก: ไม่เกิน 500 ตัวอักษร ห้ามใช้ @ ~ $
                        ^ `</span
                      >
                      <Message
                        v-if="errors[`items[${index}].remark`]"
                        severity="error"
                        size="small"
                        variant="simple"
                      >
                        {{ errors[`items[${index}].remark`][0].message }}
                      </Message>
                    </div>

                    <!-- ✅ Buyer label เปลี่ยนเป็น "Wait Purchase Accept" -->
                    <div class="field stagger-12">
                      <label>Buyer</label>
                      <div class="inp-auto">
                        <i
                          class="pi pi-clock"
                          style="font-size: 11px; opacity: 0.6"
                        ></i>
                        Wait Purchase Accept
                      </div>
                    </div>
                  </div>
                </div>

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
  height: 100dvh;
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

.drawer-body {
  flex: 1;
  min-height: 0;
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

.type-lock-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--accent);
  background: var(--border-subtle);
  border: 1px dashed var(--bg-surface);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 0 20px;
}
.col-divider {
  background: var(--border-subtle, rgba(255, 255, 255, 0.07));
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
.inp-textarea {
  resize: vertical;
  min-height: 72px;
}
select.inp {
  height: 37px;
  padding: 0 11px;
  appearance: none;
  -webkit-appearance: none;
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

.inp:disabled,
select.inp:disabled {
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.02);
  border-style: dashed;
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
  opacity: 0.55;
}
[data-theme="light"] .inp:disabled,
[data-theme="light"] select.inp:disabled {
  background: rgba(0, 0, 0, 0.03);
  color: #b0b8cc;
}

.field-closed {
  opacity: 0.55;
}
.field-closed label {
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
}
:deep(.field-closed .p-select) {
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.02) !important;
  border-style: dashed !important;
  opacity: 0.7;
}

.inp-auto {
  height: 37px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed var(--border-subtle, rgba(255, 255, 255, 0.09));
  border-radius: 8px;
  color: var(--text-muted, rgba(255, 255, 255, 0.35));
  font-size: 12px;
  padding: 8px 11px;
  font-style: italic;
}
.inp-auto--email {
  font-style: normal;
  color: var(--accent, #38a3f5);
  border-color: var(--accent-glow, rgba(56, 163, 245, 0.25));
  background: var(--accent-dim, rgba(56, 163, 245, 0.06));
}

[data-theme="light"] .inp-auto {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
  color: #8892a4;
}
[data-theme="light"] .inp-auto--email {
  color: var(--accent);
  background: var(--accent-dim);
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
.req {
  color: #f87171;
  margin-left: 2px;
}
.inp-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15) !important;
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
.attach-btn-error {
  border-color: rgba(239, 68, 68, 0.6) !important;
  color: #f87171 !important;
  background: rgba(239, 68, 68, 0.08) !important;
}
.attach-btn-done {
  border-color: rgba(16, 185, 129, 0.5) !important;
  color: #34d399 !important;
  background: rgba(16, 185, 129, 0.08) !important;
  border-style: solid !important;
}
.attach-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.attach-wrap .attach-btn {
  flex: 1;
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
.attach-remove {
  position: absolute;
  right: 6px;
  top: 45%;
  transform: translateY(-50%);
  width: 18px;
  height: 28px;
  border-radius: 25%;
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
.footer-btn-outline:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
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
.footer-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
:deep(.p-message.p-message-error) {
  background: transparent;
  border: none;
  padding: 2px 0 0;
  color: #f87171;
  font-size: 11px;
}

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
.type-hint-icon {
  margin-left: 4px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  cursor: help;
}
.type-hint-icon:hover {
  color: var(--accent, #38a3f5);
}
</style>
