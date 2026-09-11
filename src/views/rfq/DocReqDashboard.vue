<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import AppLayout from "../../layouts/AppLayout.vue";
import RfqFilterBar from "../../components/rfq/RfqFilterBar.vue";
import RfqTable from "../../components/rfq/RfqTable.vue";
import RfqPagination from "../../components/rfq/RfqPagination.vue";
import CreateDocument from "./CreateDocument.vue";
import Toast from "primevue/toast";
import { useI18n } from "vue-i18n";
import { apiFetch } from "../../utils/api.js";
import AcceptDocumentPurchase from "./AcceptDocumentPurchase.vue";
import ViewDocumentUser from "../../views/rfq/ViewDocumentUser.vue";
import WaitSumDocumentPurchase from "./WaitSumDocumentPurchase.vue";
import RejectDocumentPurchase from "./RejectDocumentPurchase.vue";
import UpdateDocument from "./UpdateDocument.vue";
import DraftDocumentUser from "./DraftDocumentUser.vue";
import PurchaseCompareDocument from "./PurchaseCompareDocument.vue";
import UserConfirmDocument from "./UserConfirmDocument.vue";
import CostSavingPurchase from "./CostSavingPurchase.vue";
import PurchaseConfirmDocument from "./PurchaseConfirmDocument.vue";
import FinishDocumentPurchase from "./FinishDocumentPurchase.vue";
const drawer = useRFQDrawerStore();
const toast = useToast();
const { t } = useI18n();
const BASE = `${import.meta.env.VITE_API_URL}`;
import { useAuthStore } from "../../stores/auth";
const auth = useAuthStore();

// ── State ──────────────────────────────────────────────
const allRows = ref([]);
const total = ref(0);
const isLoading = ref(false);
const error = ref(null);

const currentPage = ref(1);
const pageSize = ref(10);
const filters = ref({
  rfqNo: "",
  itemType: "",
  list: "",
  status: "",
  contactUser: "",
});

// ── Fetch (server-side filter + pagination) ─────────────
async function fetchDocRequest() {
  isLoading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      pageSize: pageSize.value,
        search: filters.value.rfqNo || filters.value.list || "",
        itemType: filters.value.itemType || "",
        status: filters.value.status || "",
        contactUser: filters.value.contactUser || "",
    });
    const res = await apiFetch(`${BASE}/api/doc-request?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    allRows.value = data.rows ?? [];
    total.value = data.total ?? 0;
  } catch (err) {
    error.value = err.message;
    toast.add({
      severity: "error",
      summary: "โหลดข้อมูลไม่สำเร็จ",
      detail: err.message,
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}

watch(
  filters,
  () => {
    currentPage.value = 1;
    fetchDocRequest();
  },
  { deep: true },
);

watch([currentPage, pageSize], fetchDocRequest);

watch(
  () => drawer.showDrawer,
  (isOpen) => {
    if (!isOpen) fetchDocRequest();
  },
);

onMounted(fetchDocRequest);

async function openPurchaseDrawer(docRequestId) {
  const row = allRows.value.find((r) => r.docRequestId === docRequestId);
  const status = row?.status;
  const isOwner = row?.requesterEmail === auth.user?.email;

  let drawerRole;

  if (status === "user_draft") {
    drawerRole = isOwner ? "user" : "view";
  } else if (status === "user_confirm") {
    drawerRole = isOwner ? "user_confirm" : "view";
  } else if (status === "reject") {
    // ── เจ้าของ RFQ เท่านั้นที่แก้ไข/ส่งใหม่ได้ คนอื่นดูอย่างเดียว ──
    drawerRole = isOwner ? "user" : "view";
  } else if (auth.authRole === "user") {
    drawerRole = "view";
  } else {
    const statusToDrawer = {
      user_pending: "purchase",
      purchase_accept: "purchase",
      waiting_quotation: "waiting",
      purchase_compare: "compare",
      purchase_confirm: "purchase_confirm",
      user_confirm: "user",
      cost_saving: "cost_saving",
      finish: "finish",
      cancel: "purchase",
    };
    drawerRole = statusToDrawer[status] ?? "purchase";
  }

  drawer.closeDrawer();
  await nextTick();
  drawer.openDrawer(drawerRole, null, docRequestId, status);
}
</script>

<template>
  <AppLayout
    :title="t('doc-req-dashboard.title')"
    :role="auth.authRole"
    :email="auth.user?.email"
  >
    <Toast position="top-right" />
    <RfqFilterBar
      :filters="filters"
      @update:filters="filters = $event"
      @open-drawer="drawer.openDrawer('user', null, null)"
    />
    <RfqTable
      :rows="allRows"
      :current-page="currentPage"
      :page-size="pageSize"
      @open-rfq="openPurchaseDrawer"
    />
    <RfqPagination
      v-model:page="currentPage"
      v-model:pageSize="pageSize"
      :total="total"
    />
    <DraftDocumentUser />
    <ViewDocumentUser />
    <AcceptDocumentPurchase />
    <PurchaseCompareDocument />
    <UserConfirmDocument />
    <CostSavingPurchase />
    <WaitSumDocumentPurchase />
    <RejectDocumentPurchase />
    <UpdateDocument />
    <CreateDocument />
    <PurchaseConfirmDocument />
    <FinishDocumentPurchase />
  </AppLayout>
</template>
