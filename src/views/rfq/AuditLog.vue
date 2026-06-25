<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from '../../stores/auth'
import AppLayout from "../../layouts/AppLayout.vue";
import DatePicker from "primevue/datepicker";
import Chart from "primevue/chart";
import AuditLogTable from "../../components/audit/AuditLogTable.vue";
import AuditLogPagination from "../../components/audit/AuditLogPagination.vue";
import { apiFetch } from "../../utils/api.js";

/* ── Filters ── */
const dateRange = ref(null);
const filterEmail = ref("");
const filterPurchaser = ref("");
const filterRfqNo = ref("");
const filterAction = ref("");
const actionOptions = ["Waiting", "Accept", "Resent", "Cancel"];

const rangeStart = computed(() => dateRange.value?.[0] ?? null);
const rangeEnd = computed(() => dateRange.value?.[1] ?? null);

const filteredLogs = computed(() => allLogs.value);

function clearFilters() {
  dateRange.value = null;
  filterEmail.value =
    filterPurchaser.value =
    filterRfqNo.value =
    filterAction.value =
      "";
  fetchLogs();
}

/* ── Pagination ── */
const currentPage = ref(1);
const pageSize = ref(10);
const pagedLogs = computed(() => allLogs.value);
const auth = useAuthStore()
const allLogs = ref([]);
const totalRecords = ref(0);
const loading = ref(false);

const BASE_URL = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL_BACKEND}/api/AuditLog`;

const chartLogs = ref([]);

const fetchLogs = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();

    if (rangeStart.value) {
      const start = new Date(rangeStart.value);
      const pad = (n) => String(n).padStart(2, "0");
      const localISO = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T00:00:00.000`;
      params.append("DateFrom", localISO);
    }
    if (rangeEnd.value) {
      const end = new Date(rangeEnd.value);
      const pad = (n) => String(n).padStart(2, "0");
      const localISO = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T00:00:00.000`;
      params.append("DateTo", localISO);
    }
    if (filterEmail.value) params.append("E_User", filterEmail.value);
    if (filterPurchaser.value) params.append("E_Purchaser", filterPurchaser.value);
    if (filterRfqNo.value) params.append("RfqNo", filterRfqNo.value);
    if (filterAction.value) params.append("Status", filterAction.value);
    params.append("Page", currentPage.value);
    params.append("PageSize", pageSize.value);

    const res = await apiFetch(`${BASE_URL}?${params}`);
    const json = await res.json();
    allLogs.value = json.data;
    totalRecords.value = json.total;

    const chartParams = new URLSearchParams(params);
    chartParams.set("Page", 1);
    chartParams.set("PageSize", 100);

    const chartRes = await apiFetch(`${BASE_URL}?${chartParams}`);
    const chartJson = await chartRes.json();
    chartLogs.value = chartJson.data;

    buildChart();
  } catch (e) {
    console.error("Fetch error:", e);
  } finally {
    loading.value = false;
  }
};

/* ── Chart ── */
const chartData = ref();
const chartOptions = ref();

const formatDateOnly = (value) => {
  if (!value) return "";
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return value;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dd = m[3];
  const mon = months[parseInt(m[2]) - 1];
  const yy = m[1].slice(2);

  return `${dd} ${mon} ${yy}`; // → "07 Jun 26"
};

const buildChart = () => {
  const dateMap = {};
  chartLogs.value.forEach((log) => {
    if (!log.dateTime) return;
    const label = formatDateOnly(log.dateTime);
    if (!label) return;
    dateMap[label] = (dateMap[label] || 0) + 1;
  });

  const labels = Object.keys(dateMap).sort();
  const values = labels.map((d) => dateMap[d]);

  const doc = getComputedStyle(document.documentElement);
  const accent = doc.getPropertyValue("--accent").trim() || "#38a3f5";
  const borderAccent =
    doc.getPropertyValue("--border-accent").trim() || "rgba(56,163,245,0.3)";
  const textMuted =
    doc.getPropertyValue("--text-muted").trim() || "rgba(255,255,255,0.4)";
  const borderSubtle =
    doc.getPropertyValue("--border-subtle").trim() || "rgba(255,255,255,0.07)";

  chartData.value = {
    labels,
    datasets: [
      {
        label: "Transactions",
        data: values,
        fill: true,
        borderColor: accent,
        backgroundColor: borderAccent,
        pointBackgroundColor: accent,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
    ],
  };
  chartOptions.value = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textMuted } },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { ticks: { color: textMuted }, grid: { color: borderSubtle } },
      y: {
        beginAtZero: true,
        ticks: { color: textMuted, stepSize: 1 },
        grid: { color: borderSubtle },
      },
    },
  };
};

watch(
  [dateRange, filterEmail, filterPurchaser, filterRfqNo, filterAction],
  () => {
    if (dateRange.value && dateRange.value[0] && !dateRange.value[1]) return;

    currentPage.value = 1;
    fetchLogs();
  },
);
watch(currentPage, fetchLogs);
watch(pageSize, () => {
  currentPage.value = 1;
  fetchLogs();
});

onMounted(fetchLogs);
</script>

<template>
  <AppLayout title="Audit Log" role="user" email="Test.dev@itg.co.th">
    <div class="audit-wrap">
      <!-- Stat pill -->
      <div class="stat-pill">
        <span class="stat-num">{{ totalRecords }}</span>
        <span class="stat-label">Records</span>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-item filter-date">
          <label class="filter-label">Date Range</label>
          <DatePicker
            v-model="dateRange"
            selectionMode="range"
            :manualInput="false"
            showIcon
            fluid
            :showOnFocus="false"
            dateFormat="dd/mm/yy"
            placeholder="Select date range"
            class="date-range-picker"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">User Email</label>
          <input
            v-model="filterEmail"
            class="filter-inp"
            placeholder="user@itg.co.th"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">Purchaser Email</label>
          <input
            v-model="filterPurchaser"
            class="filter-inp"
            placeholder="purchase@itg.co.th"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">RFQ No.</label>
          <input
            v-model="filterRfqNo"
            class="filter-inp"
            placeholder="RFQ-2606001"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">Status</label>
          <select v-model="filterAction" class="filter-inp">
            <option value="">— All —</option>
            <option v-for="a in actionOptions" :key="a" :value="a">
              {{ a }}
            </option>
          </select>
        </div>
        <div class="filter-item filter-clear">
          <label class="filter-label">&nbsp;</label>
          <button class="btn-clear" @click="clearFilters">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-card-title">Transaction Activity</span>
          <span class="chart-card-sub">Grouped by date</span>
        </div>
        <div class="chart-wrap">
          <Chart
            v-if="chartData"
            type="line"
            :data="chartData"
            :options="chartOptions"
            class="chart-el"
          />
        </div>
      </div>

      <!-- Table component -->
      <AuditLogTable
        :logs="pagedLogs"
        :current-page="currentPage"
        :page-size="pageSize"
      />

      <!-- Pagination component -->
      <AuditLogPagination
        :page="currentPage"
        :page-size="pageSize"
        :total="totalRecords"
        @update:page="currentPage = $event"
        @update:pageSize="pageSize = $event"
      />
    </div>
  </AppLayout>
</template>

<style scoped>
.audit-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
  font-family: "DM Sans", sans-serif;
}
.stat-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 200px;
  margin: 4px 8px;
  justify-content: center;
  background: var(--accent-dim, rgba(56, 163, 245, 0.1));
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.25));
  border-radius: 10px;
  padding: 8px 16px;
}
.stat-num {
  font-family: "Sora", sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--accent, #38a3f5);
}
.stat-label {
  font-size: 11px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 8px;
  background: var(--bg-surface, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: 14px;
  padding: 16px 18px;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 160px;
}
.filter-date {
  min-width: 220px;
}
.filter-clear {
  flex: 0;
  min-width: unset;
}
.filter-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
}
.filter-inp {
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
.filter-inp:focus {
  border-color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 2px var(--accent-dim);
}
.filter-inp::placeholder {
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
}
select.filter-inp option {
  background: var(--bg-base, #060c18);
}

.btn-clear {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 37px;
  padding: 0 14px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: rgba(248, 113, 113, 0.8);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}
.btn-clear:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.4);
}

.chart-card {
  margin: 0 8px;
  background: var(--bg-surface, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: 14px;
  padding: 18px 20px;
}
.chart-card-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}
.chart-card-title {
  font-family: "Sora", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #fff);
}
.chart-card-sub {
  font-size: 11px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
}
.chart-wrap {
  height: 220px;
}
.chart-el {
  height: 100% !important;
}

:deep(.date-range-picker .p-datepicker-input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid var(--border-subtle) !important;
  border-radius: 8px !important;
  color: var(--text-primary, #fff) !important;
  font-size: 13px !important;
  padding: 8px 11px !important;
}
:deep(.p-datepicker-panel) {
  background: var(--bg-base, #0d1428) !important;
  border: 1px solid var(--border-accent) !important;
  border-radius: 12px !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5) !important;
}
:deep(.p-datepicker-day-cell span) {
  color: var(--text-primary, #fff) !important;
  border-radius: 8px !important;
}
:deep(.p-datepicker-day-cell span:hover) {
  background: var(--accent-dim) !important;
}
:deep(.p-datepicker-day-cell span.p-highlight) {
  background: var(--accent) !important;
  color: #fff !important;
}
:deep(.p-datepicker-header) {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07) !important;
  color: var(--text-primary, #fff) !important;
}
:deep(.p-datepicker-prev-button),
:deep(.p-datepicker-next-button) {
  color: var(--accent) !important;
  background: transparent !important;
  border: none !important;
}
:deep(.p-datepicker-weekday) {
  color: rgba(255, 255, 255, 0.4) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
}
</style>
