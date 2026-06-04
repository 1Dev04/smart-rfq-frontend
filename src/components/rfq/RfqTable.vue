<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

defineProps({
  rows: {
    type: Array,
    required: true,
  },
});

const statusMap = {
  Approve: { cls: "badge-approve" },
  Waiting: { cls: "badge-waiting" },
  Reject:  { cls: "badge-reject"  },
  Cancel:  { cls: "badge-cancel"  },
};
</script>

<template>
  <div class="table-card">
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">Id</th>
            <th class="col-rfq">RFQ No.</th>
            <th class="col-type">Type</th>
            <th class="col-list">List</th>
            <th class="col-num">Qty</th>
            <th class="col-uom">UOM</th>
            <th class="col-status">Status</th>
            <th class="col-person">Requester</th>
            <th class="col-person">Purchaser</th>
            <th class="col-date">Created</th>
            <th class="col-date">Updated</th>
            <th class="col-lt">L/T (days)</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="rows.length">
            <tr v-for="row in rows" :key="row.id" class="data-row">
              <td class="col-id cell-center">{{ row.displayNo ?? row.id }}</td>
              <td class="col-rfq">
                <a class="rfq-link" @click.prevent="router.push(`/doc-request/${row.id}`)">
                  {{ row.rfqNo }}
                </a>
              </td>
              <td class="col-type">{{ row.type }}</td>
              <td class="col-list cell-mono">{{ row.list }}</td>
              <td class="col-num cell-center">{{ row.qty }}</td>
              <td class="col-uom cell-center">{{ row.uom }}</td>
              <td class="col-status cell-center">
                <span :class="['status-badge', statusMap[row.status]?.cls]">
                  {{ row.status }}
                </span>
              </td>
              <td class="col-person cell-small">{{ row.requester }}</td>
              <td class="col-person cell-small">{{ row.purchaser }}</td>
              <td class="col-date cell-small cell-muted">{{ row.created }}</td>
              <td class="col-date cell-small cell-muted">{{ row.updated }}</td>
              <td class="col-lt cell-center">{{ row.lt }}</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="12" class="empty-cell">
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
                <span>Data Not Found</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  flex: 1;
  margin: 5px 5px 0;
  background: linear-gradient(180deg, rgba(10,15,30,0.92), rgba(8,12,24,0.96));
  border: 1px solid rgba(56,163,245,0.18);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: 0 18px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04);
}
.table-scroll { overflow-x: auto; overflow-y: auto; flex: 1; }
.data-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12.5px; font-family: "DM Sans", sans-serif; }
.col-id { width: 38px; }
.col-rfq { width: 104px; }
.col-type { width: 160px; }
.col-list { width: 130px; }
.col-num { width: 42px; }
.col-uom { width: 68px; }
.col-status { width: 88px; }
.col-person { width: 110px; }
.col-date { width: 82px; }
.col-lt { width: 80px; }
thead tr {
  background: linear-gradient(180deg, rgba(17,29,60,0.95), rgba(10,18,38,0.98));
  border-bottom: 1px solid rgba(56,163,245,0.22);
}
th {
  padding: 10px 8px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 700;
  color: rgba(255,255,255,0.78);
  letter-spacing: 0.04em;
  white-space: nowrap;
  text-transform: uppercase;
}
td {
  padding: 9px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.86);
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-row { transition: background 0.15s, transform 0.15s; }
.data-row:hover td { background: rgba(56,163,245,0.08); }
.data-row:last-child td { border-bottom: none; }
.cell-center { text-align: center; }
.cell-small { font-size: 11.5px; color: rgba(255,255,255,0.55); }
.cell-muted { color: rgba(255,255,255,0.4); white-space: pre-line; }
.cell-mono { font-family: "DM Mono", monospace; font-size: 11.5px; color: rgba(255,255,255,0.6); }
.rfq-link { color: #38a3f5; font-weight: 500; cursor: pointer; text-decoration: none; transition: color 0.2s; }
.rfq-link:hover { color: #7ec8f5; text-decoration: underline; }
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  min-width: 66px;
  text-align: center;
  letter-spacing: 0.02em;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 10px rgba(0,0,0,0.18);
}
.badge-approve { background: rgba(16,185,129,0.22); color: #6ee7b7; border: 1px solid rgba(52,211,153,0.45); }
.badge-waiting { background: rgba(245,158,11,0.22); color: #fde68a; border: 1px solid rgba(251,191,36,0.45); }
.badge-reject { background: rgba(239,68,68,0.22); color: #fca5a5; border: 1px solid rgba(248,113,113,0.45); }
.badge-cancel { background: rgba(148,163,184,0.16); color: #e2e8f0; border: 1px solid rgba(148,163,184,0.35); }
.empty-cell { text-align: center; padding: 60px 0; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; color: rgba(255,255,255,0.25); font-size: 14px; }
</style>