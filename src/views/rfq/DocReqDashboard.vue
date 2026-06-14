<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "primevue/usetoast";          // ← เพิ่ม
import { useRFQDrawerStore } from '../../stores/rfqDrawer';
import AppLayout     from "../../layouts/AppLayout.vue";
import RfqFilterBar  from "../../components/rfq/RfqFilterBar.vue";
import RfqTable      from "../../components/rfq/RfqTable.vue";
import RfqPagination from "../../components/rfq/RfqPagination.vue";
import CreateDocument from './CreateDocument.vue';
import { useI18n } from "vue-i18n";

const drawer = useRFQDrawerStore();
const toast  = useToast();                             // ← เพิ่ม
const { t, locale } = useI18n();

const lang = computed({
  get: () => locale.value,
  set: (value) => {
    locale.value = value;
    localStorage.setItem("lang", value);
    document.documentElement.lang = value;
  },
});

// ── State ──────────────────────────────────────────────
const allRows   = ref([]);
const isLoading = ref(false);
const error     = ref(null);

// ── Fetch ──────────────────────────────────────────────
async function fetchDocRequest() {
  isLoading.value = true;
  error.value     = null;
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL_BACKEND}/api/doc-request`,
      { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allRows.value = Array.isArray(data) ? data : (data.data ?? []);

    // ✅ โหลดสำเร็จ
    toast.add({
      severity: "success",
      summary:  "โหลดข้อมูลสำเร็จ",
      detail:   `พบ ${allRows.value.length} รายการ`,
      life:     3000,
    });

  } catch (err) {
    error.value = err.message;

    // ❌ โหลดไม่สำเร็จ
    toast.add({
      severity: "error",
      summary:  "โหลดข้อมูลไม่สำเร็จ",
      detail:   err.message,
      closable: true,
      life:     3000,
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchDocRequest);

// ── Filters ────────────────────────────────────────────
const filters = ref({
  rfqNo: "", type: "", list: "", status: "", contactUser: "",
});

const currentPage = ref(1);
const pageSize    = ref(10);

const filteredRows = computed(() =>
  allRows.value.filter((r) => {
    const f = filters.value;
    return (
      (!f.rfqNo       || r.rfqNo.toLowerCase().includes(f.rfqNo.toLowerCase())) &&
      (!f.type        || r.type.toLowerCase().includes(f.type.toLowerCase())) &&
      (!f.list        || r.list.toLowerCase().includes(f.list.toLowerCase())) &&
      (!f.status      || r.status === f.status) &&
      (!f.contactUser || r.requester.toLowerCase().includes(f.contactUser.toLowerCase()))
    );
  })
);

const totalPages = computed(() =>
  Math.ceil(filteredRows.value.length / pageSize.value) || 1
);

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value
    .slice(start, start + pageSize.value)
    .map((row, i) => ({ ...row, displayNo: start + i + 1 }));
});

watch([filteredRows, pageSize], () => { currentPage.value = 1; });
</script>

<template>
  <AppLayout
    :title="t('doc-req-dashboard.title')"
    role="user"
    email="Test.dev@itg.co.th"
  >
    <!-- ← เพิ่มตรงนี้ -->
    <Toast position="top-right" />

    <RfqFilterBar
      :filters="filters"
      @update:filters="filters = $event"
      @open-drawer="drawer.openDrawer()"
    />
    <RfqTable :rows="pagedRows" />
    <RfqPagination
      v-model:page="currentPage"
      v-model:pageSize="pageSize"
      :total="filteredRows.length"
    />
    <CreateDocument />
  </AppLayout>
</template>