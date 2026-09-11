<script setup>
import statusMap from '../../utils/statusMap.js'

const props = defineProps({
  logs: { type: Array, required: true },
  currentPage: { type: Number, required: true },
  pageSize: { type: Number, required: true },
})

const statusBadge = (status) => statusMap.STATUS_BADGE_CLASS[status] ?? ''

const formatDateTime = (value) => {
  if (!value) return '-'
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return value

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dd  = m[3]
  const mon = months[parseInt(m[2]) - 1]
  const yy  = m[1].slice(2)   
  const hh  = m[4]
  const min = m[5]

  return `${dd} ${mon} ${yy}, ${hh}:${min}`

}
</script>

<template>
  <div class="table-card">
    <table class="audit-table">
      <thead>
        <tr>
          <th>#</th>
          <th>RFQ No.</th>
          <th>Status</th>
          <th>Role</th>
          <th>User Email</th>
          <th>Purchaser Email</th>
          <th>Remark</th>
          <th>Date / Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(log, i) in logs" :key="log.id">
          <td class="td-no">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
          <td class="td-rfq">{{ log.rfqNo }}</td>
          <td>
            <span :class="['action-badge', statusBadge(log.status)]">{{ statusMap.STATUS_LABEL[log.status] ?? log.status }}</span>
          </td>
          <td>
            <span :class="['role-badge', log.role === 'purchase' ? 'role-purchase' : 'role-user']">
              {{ log.role === 'purchase' ? '🏢 Purchase' : '👤 User' }}
            </span>
          </td>
          <td class="td-email">{{ log.e_User }}</td>
          <td class="td-email">{{ log.e_Purchaser }}</td>
          <td class="td-remark">{{ log.remark }}</td>
          <td class="td-dt">
  {{ formatDateTime(log.dateTime) }}
</td>
        </tr>
        <tr v-if="logs.length === 0">
          <td colspan="8" class="td-empty">No records found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-card {
  background: var(--bg-surface, rgba(255,255,255,0.03));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
  border-radius: 14px; overflow: hidden; margin: 0 8px;
}
.audit-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
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

.action-badge {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; white-space: nowrap;
}

/* user_pending: รอ user ส่งคำขอ/ดำเนินการต่อ ให้ความรู้สึก "รอคิว" ที่ต้องสนใจ
   ใช้โทนส้ม (ไม่ใช่เหลืองอำพันแบบ waiting-quotation เพื่อไม่ให้สับสนกันเป็นสถานะเดียวกัน) */
.badge-pending {
  background: var(--pending-bg, rgba(249, 115, 22, 0.18));
  color: var(--pending, #c7935b);
  border: 1px solid var(--pending-border, rgba(251, 146, 60, 0.4));
}

/* user_draft: ยังไม่ส่ง ไม่มี action ใด ๆ เกิดขึ้น จึงคงโทนเทาเป็นกลาง */
.badge-draft {
  background: var(--draft-bg, rgba(148, 163, 184, 0.16));
  color: var(--draft, #a9b1b9);
  border: 1px solid var(--draft-border, rgba(148, 163, 184, 0.35));
}
.badge-purchase-accept {
  background: var(--accept-bg, rgba(16, 185, 129, 0.22));
  color: var(--accept, #6ee7b7);
  border: 1px solid var(--accept-border, rgba(52, 211, 153, 0.45));
}
.badge-waiting-quotation {
  background: var(--waiting-bg, rgba(245, 158, 11, 0.22));
  color: var(--waiting, #fde68a);
  border: 1px solid var(--waiting-border, rgba(251, 191, 36, 0.45));
}
.badge-purchase-compare {
  background: var(--compare-bg, rgba(140, 34, 238, 0.2));
  color: var(--compare, #5e1fa1);
  border: 1px solid var(--compare-border, rgba(160, 69, 251, 0.4));
}
.badge-user-confirm {
  background: var(--confirm-bg, rgba(59, 130, 246, 0.2));
  color: var(--confirm, #3187ea);
  border: 1px solid var(--confirm-border, rgba(96, 165, 250, 0.4));
}
.badge-purchase-confirm {
  background: var(--pconfirm-bg, rgba(20, 184, 166, 0.2));
  color: var(--pconfirm, #5eead4);
  border: 1px solid var(--pconfirm-border, rgba(45, 212, 191, 0.4));
}
.badge-finish {
  background: var(--finish-bg, rgba(34, 197, 94, 0.24));
  color: var(--finish, #049439);
  border: 1px solid var(--finish-border, rgba(74, 222, 128, 0.45));
}
.badge-reject {
  background: var(--resent-bg, rgba(239, 68, 68, 0.22));
  color: var(--resent, #fca5a5);
  border: 1px solid var(--resent-border, rgba(248, 113, 113, 0.45));
}
.badge-cancel {
  background: var(--cancel-bg, rgba(148, 163, 184, 0.16));
  color: var(--cancel, #e2e8f0);
  border: 1px solid var(--cancel-border, rgba(148, 163, 184, 0.35));
}

.badge-purchase-compare {
  background: var(--compare-bg, rgba(140, 34, 238, 0.2));
  color: var(--compare, #5e1fa1);
  border: 1px solid var(--compare-border, rgba(160, 69, 251, 0.4));
}
.badge-user-confirm {
  background: var(--confirm-bg, rgba(59, 130, 246, 0.2));
  color: var(--confirm, #3187ea);
  border: 1px solid var(--confirm-border, rgba(96, 165, 250, 0.4));
}
.badge-cost-saving {
  background: var(--saving-bg, rgba(234, 179, 8, 0.2));
  color: var(--saving, #9f7906);
  border: 1px solid var(--saving-border, rgba(250, 204, 21, 0.4));
}
.badge-purchase-confirm {
  background: var(--pconfirm-bg, rgba(20, 184, 166, 0.2));
  color: var(--pconfirm, #208872);
  border: 1px solid var(--pconfirm-border, rgba(45, 212, 191, 0.4));
}

.role-badge { display: inline-block; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.role-user     { background: rgba(56,163,245,0.1);  color: #38a3f5;  border: 1px solid rgba(56,163,245,0.25); }
.role-purchase { background: rgba(168,85,247,0.1); color: #c084fc;  border: 1px solid rgba(168,85,247,0.25); }
</style>