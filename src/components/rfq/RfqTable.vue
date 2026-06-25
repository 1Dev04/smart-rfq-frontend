<script setup>
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { supportedLocales, setLocale } from "../../i18n";
import { STATUS_LABEL } from "../../utils/statusMap";

const router = useRouter();

const { t, locale } = useI18n();
const langOptions = supportedLocales;

const lang = computed({
  get: () => locale.value,
  set: (value) => {
    setLocale(value);
  },
});

defineProps({
  rows: {
    type: Array,
    required: true,
  },
});

const statusMap = {
  Accept: { cls: "badge-accept" },
  Waiting: { cls: "badge-waiting" },
  Resent:  { cls: "badge-resent"  },
  Cancel:  { cls: "badge-cancel"  },
};
</script>

<template>
  <div class="table-card">
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">{{ t('doc-req-dashboard.filter.id') }}</th>
            <th class="col-rfq">{{ t('doc-req-dashboard.filter.rfq-no') }}</th>
            <th class="col-type">{{ t('doc-req-dashboard.filter.type') }}</th>
            <th class="col-list">{{ t('doc-req-dashboard.filter.list') }}</th>
            <th class="col-num cell-center">{{ t('doc-req-dashboard.filter.qty') }}</th>
            <th class="col-uom cell-center">{{ t('doc-req-dashboard.filter.uom') }}</th>
            <th class="col-status cell-center">{{ t('doc-req-dashboard.filter.status') }}</th>
            <th class="col-person">{{ t('doc-req-dashboard.filter.requester') }}</th>
            <th class="col-person">{{ t('doc-req-dashboard.filter.purchaser') }}</th>
            <th class="col-date">{{ t('doc-req-dashboard.filter.created') }}</th>
            <th class="col-date">{{ t('doc-req-dashboard.filter.updated') }}</th>
            <th class="col-lt">{{ t('doc-req-dashboard.filter.l&t') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="rows.length">
            <tr v-for="row in rows" :key="row.id" class="data-row">
              <td class="col-id ">{{ row.displayNo ?? row.id }}</td>
              <td class="col-rfq">
                <a class="rfq-link" @click.prevent="router.push(`/doc-request/${row.id}`)">
                  {{ row.rfqNo  || "-" }} 
                </a>
              </td>
              <td class="col-type">{{ row.itemType  || "-"  }} </td>
              <td class="col-list cell-mono">{{ row.itemDescription  || "-" }}</td>
              <td class="col-num cell-center">{{ row.quantity  || "-" }}</td>
              <td class="col-uom cell-center">{{ row.uom  || "-" }}</td>
              <td class="col-uom cell-center">{{ STATUS_LABEL[row.status] ?? row.status }}</td>
              <td class="col-person cell-small">{{ row.requesterEmail  || "-" }}</td>
              <td class="col-person cell-small">{{ row.purchaserEmail  || "-" }}</td>
              <td class="col-date cell-small cell-muted">{{ row.createdAt  || "-" }}</td>
              <td class="col-date cell-small cell-muted">{{ row.updatedAt  || "-" }}</td>
              <td class="col-lt cell-center">{{ row.leadTimeDays  || "-" }}</td>
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
  background: linear-gradient(180deg, var(--bg-base, #0a0f1e), var(--bg-elevated, #101827));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: var(--shadow, 0 18px 36px rgba(0,0,0,0.28));
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
  background: linear-gradient(180deg, var(--bg-elevated, #172033), var(--bg-base, #0a0f1e));
  border-bottom: 1px solid var(--border-accent, rgba(56,163,245,0.3));
}
th {
  padding: 10px 8px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary, rgba(255,255,255,0.65));
  letter-spacing: 0.04em;
  white-space: nowrap;
  text-transform: uppercase;
}
td {
  padding: 9px 8px;
  border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  color: var(--text-primary, #fff);
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-row { transition: background 0.15s, transform 0.15s; }
.data-row:hover td { background: var(--accent-dim, rgba(56,163,245,0.15)); }
.data-row:last-child td { border-bottom: none; }
.cell-center { text-align: center; }
.cell-small { font-size: 11.5px; color: var(--text-secondary, rgba(255,255,255,0.65)); }
.cell-muted { color: var(--text-secondary, rgba(255,255,255,0.65)); white-space: pre-line; }
.cell-mono { font-family: "DM Mono", monospace; font-size: 11.5px; color: var(--text-primary, #fff); }
.rfq-link { color: var(--accent, #38a3f5); font-weight: 500; cursor: pointer; text-decoration: none; transition: color 0.2s; }
.rfq-link:hover { color: var(--accent-alt, #7ec8f5); text-decoration: underline; }
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
.badge-accept { background: var(--accept-bg, rgba(16,185,129,0.22)); color: var(--accept, #6ee7b7); border: 1px solid var(--accept-border, rgba(52,211,153,0.45)); }
.badge-waiting { background: var(--waiting-bg, rgba(245,158,11,0.22)); color: var(--waiting, #fde68a); border: 1px solid var(--waiting-border, rgba(251,191,36,0.45)); }
.badge-resent { background: var(--resent-bg, rgba(239,68,68,0.22)); color: var(--resent, #fca5a5); border: 1px solid var(--resent-border, rgba(248,113,113,0.45)); }
.badge-cancel { background: var(--cancel-bg, rgba(148,163,184,0.16)); color: var(--cancel, #e2e8f0); border: 1px solid var(--cancel-border, rgba(148,163,184,0.35)); }

.empty-cell { text-align: center; padding: 60px 0; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-muted, rgba(255,255,255,0.35)); font-size: 14px;  }
</style>