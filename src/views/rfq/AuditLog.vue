<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '../../layouts/AppLayout.vue'
import DatePicker from 'primevue/datepicker'
import Chart from 'primevue/chart'


const { t } = useI18n()

// ══ MOCK DATA ══
const allLogs = ref([
  { id:1,  rfqNo:'RFQ-260601-01', action:'Create',  role:'user',     email:'user.a@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-01 08:12:33' },
  { id:2,  rfqNo:'RFQ-260601-01', action:'Send',    role:'user',     email:'user.a@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Sent request to purchase',  datetime:'2026-06-01 09:05:11' },
  { id:3,  rfqNo:'RFQ-260601-01', action:'Accept',  role:'purchase', email:'user.a@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Accepted by purchase',      datetime:'2026-06-01 10:30:44' },
  { id:4,  rfqNo:'RFQ-260602-01', action:'Create',  role:'user',     email:'user.b@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-02 08:44:00' },
  { id:5,  rfqNo:'RFQ-260602-01', action:'Send',    role:'user',     email:'user.b@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Sent request to purchase',  datetime:'2026-06-02 09:15:22' },
  { id:6,  rfqNo:'RFQ-260602-02', action:'Create',  role:'user',     email:'user.c@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-02 11:00:05' },
  { id:7,  rfqNo:'RFQ-260602-02', action:'Reject',  role:'purchase', email:'user.c@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Missing specification',     datetime:'2026-06-02 13:45:18' },
  { id:8,  rfqNo:'RFQ-260603-01', action:'Create',  role:'user',     email:'user.a@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-03 08:05:59' },
  { id:9,  rfqNo:'RFQ-260603-01', action:'Send',    role:'user',     email:'user.a@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Sent request to purchase',  datetime:'2026-06-03 08:55:30' },
  { id:10, rfqNo:'RFQ-260603-01', action:'Accept',  role:'purchase', email:'user.a@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Accepted',                  datetime:'2026-06-03 10:10:10' },
  { id:11, rfqNo:'RFQ-260603-02', action:'Create',  role:'user',     email:'user.d@itg.co.th',     purchaser:'purchase.c@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-03 11:30:00' },
  { id:12, rfqNo:'RFQ-260604-01', action:'Create',  role:'user',     email:'user.b@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-04 09:00:00' },
  { id:13, rfqNo:'RFQ-260604-01', action:'Send',    role:'user',     email:'user.b@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Sent request to purchase',  datetime:'2026-06-04 09:30:00' },
  { id:14, rfqNo:'RFQ-260604-01', action:'Cancel',  role:'user',     email:'user.b@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Cancelled by requester',    datetime:'2026-06-04 11:00:00' },
  { id:15, rfqNo:'RFQ-260605-01', action:'Create',  role:'user',     email:'user.e@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-05 08:20:00' },
  { id:16, rfqNo:'RFQ-260605-01', action:'Send',    role:'user',     email:'user.e@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Sent request',              datetime:'2026-06-05 08:50:00' },
  { id:17, rfqNo:'RFQ-260605-01', action:'Accept',  role:'purchase', email:'user.e@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Accepted',                  datetime:'2026-06-05 10:00:00' },
  { id:18, rfqNo:'RFQ-260605-02', action:'Create',  role:'user',     email:'user.c@itg.co.th',     purchaser:'purchase.c@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-05 13:10:00' },
  { id:19, rfqNo:'RFQ-260606-01', action:'Create',  role:'user',     email:'user.a@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-06 08:00:00' },
  { id:20, rfqNo:'RFQ-260606-01', action:'Send',    role:'user',     email:'user.a@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Sent request',              datetime:'2026-06-06 09:00:00' },
  { id:21, rfqNo:'RFQ-260606-01', action:'Reject',  role:'purchase', email:'user.a@itg.co.th',     purchaser:'purchase.a@itg.co.th', remark:'Incomplete data',           datetime:'2026-06-06 10:30:00' },
  { id:22, rfqNo:'RFQ-260606-02', action:'Create',  role:'user',     email:'user.d@itg.co.th',     purchaser:'purchase.b@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-06 11:00:00' },
  { id:23, rfqNo:'RFQ-260607-01', action:'Create',  role:'user',     email:'user.b@itg.co.th',     purchaser:'purchase.c@itg.co.th', remark:'Created new RFQ',          datetime:'2026-06-07 08:10:00' },
  { id:24, rfqNo:'RFQ-260607-01', action:'Send',    role:'user',     email:'user.b@itg.co.th',     purchaser:'purchase.c@itg.co.th', remark:'Sent request',              datetime:'2026-06-07 08:40:00' },
  { id:25, rfqNo:'RFQ-260607-01', action:'Accept',  role:'purchase', email:'user.b@itg.co.th',     purchaser:'purchase.c@itg.co.th', remark:'Accepted',                  datetime:'2026-06-07 09:30:00' },
])

// ══ DATE RANGE ══
const dateRange = ref(null)

const rangeStart = computed(() => dateRange.value?.[0] ?? null)
const rangeEnd   = computed(() => dateRange.value?.[1] ?? null)

// ══ FILTERS ══
const filterEmail     = ref('')
const filterPurchaser = ref('')
const filterRfqNo     = ref('')
const filterAction    = ref('')

const actionOptions = ['Create', 'Send', 'Accept', 'Reject', 'Cancel']

// ══ FILTERED LOGS ══
const filteredLogs = computed(() => {
  return allLogs.value.filter(log => {
    const logDate = new Date(log.datetime)

    if (rangeStart.value && logDate < rangeStart.value) return false
    if (rangeEnd.value) {
      const endOfDay = new Date(rangeEnd.value)
      endOfDay.setHours(23, 59, 59, 999)
      if (logDate > endOfDay) return false
    }
    if (filterEmail.value     && !log.email.toLowerCase().includes(filterEmail.value.toLowerCase()))         return false
    if (filterPurchaser.value && !log.purchaser.toLowerCase().includes(filterPurchaser.value.toLowerCase())) return false
    if (filterRfqNo.value     && !log.rfqNo.toLowerCase().includes(filterRfqNo.value.toLowerCase()))         return false
    if (filterAction.value    && log.action !== filterAction.value)                                           return false

    return true
  })
})

// ══ CHART ══
const chartData    = ref()
const chartOptions = ref()

const buildChart = () => {
  // grouping by date
  const dateMap = {}
  filteredLogs.value.forEach(log => {
    const d = log.datetime.slice(0, 10)
    dateMap[d] = (dateMap[d] || 0) + 1
  })
  const labels = Object.keys(dateMap).sort()
  const values = labels.map(d => dateMap[d])

  const doc = getComputedStyle(document.documentElement)

  chartData.value = {
    labels,
    datasets: [
      {
        label: 'Transactions',
        data: values,
        fill: true,
        borderColor: 'rgba(56,163,245,0.9)',
        backgroundColor: 'rgba(56,163,245,0.15)',
        pointBackgroundColor: 'rgba(56,163,245,1)',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
      }
    ]
  }

  chartOptions.value = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: { color: doc.getPropertyValue('--p-text-color') || '#fff' }
      },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: {
        ticks: { color: doc.getPropertyValue('--p-text-muted-color') || 'rgba(255,255,255,0.5)' },
        grid:  { color: doc.getPropertyValue('--p-content-border-color') || 'rgba(255,255,255,0.07)' }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: doc.getPropertyValue('--p-text-muted-color') || 'rgba(255,255,255,0.5)',
          stepSize: 1
        },
        grid: { color: doc.getPropertyValue('--p-content-border-color') || 'rgba(255,255,255,0.07)' }
      }
    }
  }
}


watch(filteredLogs, buildChart, { immediate: false })
onMounted(buildChart)

// ══ ACTION BADGE COLOR ══
const actionColor = (action) => ({
  'Create': 'badge-blue',
  'Send':   'badge-cyan',
  'Accept': 'badge-green',
  'Reject': 'badge-red',
  'Cancel': 'badge-gray',
}[action] || 'badge-gray')

// ══ PAGINATION ══
const currentPage = ref(1)
const pageSize    = ref(15)
const totalPages  = computed(() => Math.ceil(filteredLogs.value.length / pageSize.value) || 1)
const pagedLogs   = computed(() => {
  const s = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(s, s + pageSize.value)
})
watch(filteredLogs, () => { currentPage.value = 1 })

function clearFilters() {
  dateRange.value     = null
  filterEmail.value   = ''
  filterPurchaser.value = ''
  filterRfqNo.value   = ''
  filterAction.value  = ''
}
</script>

<template>
  <AppLayout title="Audit Log" role="user" email="Test.dev@itg.co.th">
          <div class="stat-pill">
            <span class="stat-num">{{ filteredLogs.length }}</span>
            <span class="stat-label">Records</span>
          </div>
        
    <div class="audit-wrap">

      <div class="filter-bar">
        <!-- Date Range -->
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
            @update:modelValue="buildChart"
            class="date-range-picker"
          />
        </div>

        <!-- Email User -->
        <div class="filter-item">
          <label class="filter-label">User Email</label>
          <input
            v-model="filterEmail"
            class="filter-inp"
            placeholder="user@itg.co.th"
          />
        </div>

        <!-- Purchaser -->
        <div class="filter-item">
          <label class="filter-label">Purchaser Email</label>
          <input
            v-model="filterPurchaser"
            class="filter-inp"
            placeholder="purchase@itg.co.th"
          />
        </div>

        <!-- RFQ No -->
        <div class="filter-item">
          <label class="filter-label">RFQ No.</label>
          <input
            v-model="filterRfqNo"
            class="filter-inp"
            placeholder="RFQ-260601-01"
          />
        </div>

        <!-- Action -->
        <div class="filter-item">
          <label class="filter-label">Action</label>
          <select v-model="filterAction" class="filter-inp">
            <option value="">— All —</option>
            <option v-for="a in actionOptions" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <!-- Clear -->
        <div class="filter-item filter-clear">
          <label class="filter-label">&nbsp;</label>
          <button class="btn-clear" @click="clearFilters">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Clear
          </button>
        </div>
      </div>

      <!-- ══ CHART ══ -->
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

      <!-- ══ TABLE ══ -->
      <div class="table-card">
        <table class="audit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>RFQ No.</th>
              <th>Action</th>
              <th>Role</th>
              <th>User Email</th>
              <th>Purchaser Email</th>
              <th>Remark</th>
              <th>Date / Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, i) in pagedLogs" :key="log.id">
              <td class="td-no">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
              <td class="td-rfq">{{ log.rfqNo }}</td>
              <td>
                <span :class="['action-badge', actionColor(log.action)]">
                  {{ log.action }}
                </span>
              </td>
              <td>
                <span :class="['role-badge', log.role === 'purchase' ? 'role-purchase' : 'role-user']">
                  {{ log.role === 'purchase' ? '🏢 Purchase' : '👤 User' }}
                </span>
              </td>
              <td class="td-email">{{ log.email }}</td>
              <td class="td-email">{{ log.purchaser }}</td>
              <td class="td-remark">{{ log.remark }}</td>
              <td class="td-dt">{{ log.datetime }}</td>
            </tr>
            <tr v-if="pagedLogs.length === 0">
              <td colspan="8" class="td-empty">No records found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══ PAGINATION ══ -->
      <div class="pagination">
        <span class="pg-info">
          {{ filteredLogs.length }} records · Page {{ currentPage }} / {{ totalPages }}
        </span>
        <div class="pg-btns">
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">‹ Prev</button>
          <button
            v-for="p in totalPages" :key="p"
            :class="['pg-btn', { 'pg-btn-active': p === currentPage }]"
            @click="currentPage = p"
          >{{ p }}</button>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next ›</button>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<style scoped>
.audit-wrap {
  display: flex; flex-direction: column; gap: 20px;
  padding: 4px 0;
  font-family: 'DM Sans', sans-serif;
}

/* HEADER */
.audit-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
}
.audit-title-block { display: flex; align-items: center; gap: 14px; }
.audit-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  color: var(--accent, #38a3f5);
  display: flex; align-items: center; justify-content: center;
}
.audit-title {
  font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700;
  color: var(--text-primary, #fff); margin: 0 0 2px;
}
.audit-sub { font-size: 12px; color: var(--text-muted, rgba(255,255,255,0.4)); margin: 0; }
.stat-pill {
  display: flex; align-items: baseline; gap: 10px;
  width: 200px;
  margin: 10px 10px; 
  justify-content: center;
  align-items: center;
  background: var(--accent-dim, rgba(56,163,245,0.1));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.25));
  border-radius: 10px; padding: 8px 16px;
}
.stat-num { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; color: var(--accent, #38a3f5); }
.stat-label { font-size: 11px; color: var(--text-muted, rgba(255,255,255,0.4)); }

/* FILTER BAR */
.filter-bar {
  display: flex; flex-wrap: wrap; gap: 12px;
  background: var(--bg-surface, rgba(255,255,255,0.03));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
  border-radius: 14px; padding: 16px 18px;
}
.filter-item { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 160px; }
.filter-date { min-width: 220px; }
.filter-clear { flex: 0; min-width: unset; }
.filter-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-muted, rgba(255,255,255,0.4));
}
.filter-inp {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.09));
  border-radius: 8px; color: var(--text-primary, #fff);
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  padding: 8px 11px; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.filter-inp:focus {
  border-color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 2px var(--accent-dim, rgba(56,163,245,0.15));
}
.filter-inp::placeholder { color: var(--text-muted, rgba(255,255,255,0.25)); }
select.filter-inp option { background: var(--bg-base, #060c18); }

.btn-clear {
  display: flex; align-items: center; gap: 6px;
  height: 37px; padding: 0 14px; border-radius: 8px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  color: rgba(248,113,113,0.8);
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.18s; white-space: nowrap;
}
.btn-clear:hover {
  background: rgba(239,68,68,0.15);
  color: #f87171;
  border-color: rgba(239,68,68,0.4);
}

/* DatePicker override */
:deep(.date-range-picker .p-datepicker-input) {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.09)) !important;
  border-radius: 8px !important;
  color: var(--text-primary, #fff) !important;
  font-size: 13px !important;
  padding: 8px 11px !important;
}
:deep(.date-range-picker .p-datepicker-input::placeholder) {
  color: var(--text-muted, rgba(255,255,255,0.25)) !important;
}
:deep(.date-range-picker .p-datepicker-dropdown) {
  background: var(--accent-dim, rgba(56,163,245,0.15)) !important;
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3)) !important;
  border-left: none !important; border-radius: 0 8px 8px 0 !important;
  color: var(--accent, #38a3f5) !important;
}
:deep(.p-datepicker-panel) {
  background: var(--bg-base, #0d1428) !important;
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3)) !important;
  border-radius: 12px !important;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5) !important;
}
:deep(.p-datepicker-day-cell span) { color: var(--text-primary, #fff) !important; border-radius: 8px !important; }
:deep(.p-datepicker-day-cell span:hover) { background: var(--accent-dim, rgba(56,163,245,0.15)) !important; }
:deep(.p-datepicker-day-cell span.p-highlight) { background: var(--accent, #38a3f5) !important; color: #fff !important; }
:deep(.p-datepicker-day-cell span.p-disabled) { color: rgba(255,255,255,0.2) !important; }
:deep(.p-datepicker-today span) { border: 1px solid var(--accent, #38a3f5) !important; }
:deep(.p-datepicker-header) {
  background: transparent !important;
  border-bottom: 1px solid rgba(255,255,255,0.07) !important;
  color: var(--text-primary, #fff) !important;
}
:deep(.p-datepicker-prev-button), :deep(.p-datepicker-next-button) {
  color: var(--accent, #38a3f5) !important; background: transparent !important; border: none !important;
}
:deep(.p-datepicker-weekday) {
  color: rgba(255,255,255,0.4) !important; font-size: 11px !important; font-weight: 600 !important;
}
/* range highlight */
:deep(.p-datepicker-day-cell.p-datepicker-day-selected-range span) {
  background: var(--accent-dim, rgba(56,163,245,0.2)) !important;
  border-radius: 0 !important;
}

/* CHART */
.chart-card {
  background: var(--bg-surface, rgba(255,255,255,0.03));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
  border-radius: 14px; padding: 18px 20px;
}
.chart-card-header {
  display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px;
}
.chart-card-title {
  font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700;
  color: var(--text-primary, #fff);
}
.chart-card-sub { font-size: 11px; color: var(--text-muted, rgba(255,255,255,0.4)); }
.chart-wrap { height: 220px; }
.chart-el { height: 100% !important; }

/* TABLE */
.table-card {
  background: var(--bg-surface, rgba(255,255,255,0.03));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
  border-radius: 14px; overflow: hidden;
}
.audit-table {
  width: 100%; border-collapse: collapse;
  font-size: 12.5px;
}
.audit-table thead tr {
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
}
.audit-table th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-muted, rgba(255,255,255,0.45));
  white-space: nowrap;
}
.audit-table tbody tr {
  border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
  transition: background 0.15s;
}
.audit-table tbody tr:hover { background: rgba(255,255,255,0.03); }
.audit-table td { padding: 10px 14px; color: var(--text-primary, #fff); vertical-align: middle; }
.td-no    { color: var(--text-muted, rgba(255,255,255,0.4)); font-size: 11px; width: 40px; }
.td-rfq   { font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600; color: var(--accent, #38a3f5); white-space: nowrap; }
.td-email { font-size: 12px; color: var(--text-secondary, rgba(255,255,255,0.65)); }
.td-remark { font-size: 12px; color: var(--text-muted, rgba(255,255,255,0.5)); }
.td-dt    { font-size: 11.5px; color: var(--text-muted, rgba(255,255,255,0.4)); white-space: nowrap; }
.td-empty { text-align: center; padding: 32px; color: var(--text-muted, rgba(255,255,255,0.3)); font-style: italic; }

/* ACTION BADGE */
.action-badge {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; white-space: nowrap;
}
.badge-blue  { background: rgba(56,163,245,0.15);  color: #38a3f5;  border: 1px solid rgba(56,163,245,0.3);  }
.badge-cyan  { background: rgba(34,211,238,0.12);  color: #22d3ee;  border: 1px solid rgba(34,211,238,0.3);  }
.badge-green { background: rgba(16,185,129,0.12);  color: #34d399;  border: 1px solid rgba(16,185,129,0.3);  }
.badge-red   { background: rgba(239,68,68,0.12);   color: #f87171;  border: 1px solid rgba(239,68,68,0.3);   }
.badge-gray  { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1); }

/* ROLE BADGE */
.role-badge {
  display: inline-block; padding: 3px 9px; border-radius: 6px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.role-user     { background: rgba(56,163,245,0.1);  color: #38a3f5;  border: 1px solid rgba(56,163,245,0.25); }
.role-purchase { background: rgba(168,85,247,0.1);  color: #c084fc;  border: 1px solid rgba(168,85,247,0.25); }

/* PAGINATION */
.pagination {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px;
  padding: 4px 0;
}
.pg-info { font-size: 11.5px; color: var(--text-muted, rgba(255,255,255,0.4)); }
.pg-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.pg-btn {
  height: 32px; min-width: 32px; padding: 0 10px; border-radius: 7px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  color: var(--text-secondary, rgba(255,255,255,0.6));
  font-size: 12px; cursor: pointer; transition: all 0.15s;
}
.pg-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: var(--text-primary, #fff); }
.pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pg-btn-active {
  background: var(--accent-dim, rgba(56,163,245,0.15)) !important;
  border-color: var(--border-accent, rgba(56,163,245,0.35)) !important;
  color: var(--accent, #38a3f5) !important;
  font-weight: 700;
}
</style>