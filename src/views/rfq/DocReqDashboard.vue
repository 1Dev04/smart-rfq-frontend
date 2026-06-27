<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
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
import ViewDocumentPurchase from "../../views/rfq/ViewDocumentPurchase.vue";
import ViewDocumentUser from "../../views/rfq/ViewDocumentUser.vue"; 
const drawer = useRFQDrawerStore();
const toast = useToast();
const { t, locale } = useI18n();
const BASE = `${import.meta.env.VITE_LOCAL_BACKEND}`;
import { useAuthStore } from '../../stores/auth'
const auth = useAuthStore()

const lang = computed({
  get: () => locale.value,
  set: (value) => {
    locale.value = value;
    localStorage.setItem("lang", value);
    document.documentElement.lang = value;
  },
});

// ── Filters ────────────────────────────────────────────
const filters = ref({
  rfqNo: "",
  type: "",
  list: "",
  status: "",
  contactUser: "",
});
const currentPage = ref(1);
const pageSize = ref(10);

const filteredRows = computed(() =>
  allRows.value.filter((r) => {
    const f = filters.value;
    return (
      (!f.rfqNo || r.rfqNo?.toLowerCase().includes(f.rfqNo.toLowerCase())) &&
      (!f.type || r.itemType?.toLowerCase().includes(f.type.toLowerCase())) &&
      (!f.list ||
        r.itemDescription?.toLowerCase().includes(f.list.toLowerCase())) &&
      (!f.status || r.status === f.status) &&
      (!f.contactUser ||
        r.requesterEmail?.toLowerCase().includes(f.contactUser.toLowerCase()))
    );
  }),
);
const totalPages = computed(
  () => Math.ceil(filteredRows.value.length / pageSize.value) || 1,
);
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value
    .slice(start, start + pageSize.value)
    .map((row, i) => ({ ...row, displayNo: start + i + 1 }));
});

// ── State ──────────────────────────────────────────────
const allRows = ref([]);
const isLoading = ref(false);
const error = ref(null);
// ── Fetch ──────────────────────────────────────────────
async function fetchDocRequest() {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await apiFetch(`${BASE}/api/doc-request`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
  
    allRows.value = data.rows ?? data.data ?? [];
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
  [filteredRows, pageSize, filters],
  () => {
    currentPage.value = 1;
  },
  { deep: true },
);

watch(
  () => drawer.showDrawer,
  (isOpen) => {
    if (!isOpen) fetchDocRequest();
  },
);

onMounted(fetchDocRequest);

async function openPurchaseDrawer(docRequestId) {
  const rawRole = auth.role
  const drawerRole = rawRole === 'purchaser' ? 'purchase' : rawRole
  
  
  
  drawer.closeDrawer()
  await nextTick()
  drawer.openDrawer(drawerRole, null, docRequestId)
  
  
}

</script>

<template>
  <AppLayout
  :title="t('doc-req-dashboard.title')"
  :role="auth.role"
  :email="auth.email"
>
    <!-- ← เพิ่มตรงนี้ -->
    <Toast position="top-right" />
    <RfqFilterBar
      :filters="filters"
      @update:filters="filters = $event"
      @open-drawer="drawer.openDrawer('user', null, null)"
    />
    <RfqTable :rows="pagedRows" @open-rfq="openPurchaseDrawer" />
    <RfqPagination
      v-model:page="currentPage"
      v-model:pageSize="pageSize"
      :total="filteredRows.length"
    />
    <ViewDocumentUser /> 
    <ViewDocumentPurchase />
    <CreateDocument />
    
  </AppLayout>
</template>
