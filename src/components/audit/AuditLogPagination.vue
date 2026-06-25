
<script setup>

const props = defineProps({
  page:     { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total:    { type: Number, required: true },
})

const emit = defineEmits(['update:page', 'update:pageSize'])

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1)
const from = computed(() => props.total ? (props.page - 1) * props.pageSize + 1 : 0)
const to   = computed(() => Math.min(props.page * props.pageSize, props.total))

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = props.page
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 3)          return [1, 2, 3, 4, 5]
  if (cur >= total - 2)  return [total-4, total-3, total-2, total-1, total]
  return [cur-2, cur-1, cur, cur+1, cur+2]
})

function setPage(p) {
  if (p < 1 || p > totalPages.value) return
  emit('update:page', p)
}

function setSize(e) {
  emit('update:pageSize', Number(e.target.value))
  emit('update:page', 1)
}

import { computed } from 'vue'
</script>

<template>
  <div class="pagination-bar">
    <span class="showing-text">
      Showing {{ from }} to {{ to }} of {{ total }} records
    </span>

    <div class="pagination">
      <span class="show-label">Show</span>
      <div class="select-wrap">
        <select :value="pageSize" class="size-select" @change="setSize">
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <svg class="select-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>

      <button class="pg-btn" :disabled="page === 1" @click="setPage(1)">«</button>
      <button class="pg-btn" :disabled="page === 1" @click="setPage(page - 1)">‹</button>
      <button
        v-for="p in pageNumbers" :key="p"
        :class="['pg-btn', { active: p === page }]"
        @click="setPage(p)"
      >{{ p }}</button>
      <button class="pg-btn" :disabled="page === totalPages" @click="setPage(page + 1)">›</button>
      <button class="pg-btn" :disabled="page === totalPages" @click="setPage(totalPages)">»</button>
    </div>
  </div>
</template>

<style scoped>
.pagination-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
 
  border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  flex-shrink: 0; font-family: 'DM Sans', sans-serif;
}
.showing-text { font-size: 12.5px; color: var(--text-muted, rgba(255,255,255,0.35)); }
.pagination { display: flex; align-items: center; gap: 5px; }
.show-label { font-size: 12.5px; color: var(--text-muted, rgba(255,255,255,0.35)); margin-right: 4px; }

.select-wrap { position: relative; display: inline-flex; }
.size-select {
  appearance: none; height: 28px; padding: 0 24px 0 8px;
  background: var(--bg-elevated, rgba(255,255,255,0.08));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  border-radius: 6px; color: var(--text-primary, #fff);
  font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; outline: none;
}
.size-select option { background: var(--bg-base, #0d1428); color: var(--text-primary, #fff); }
.select-arrow {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  color: var(--text-muted, rgba(255,255,255,0.35)); pointer-events: none;
}

.pg-btn {
  min-width: 28px; height: 28px; padding: 0 6px;
  background: var(--bg-elevated, rgba(255,255,255,0.08));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  border-radius: 6px; color: var(--text-secondary, rgba(255,255,255,0.65));
  font-size: 12.5px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.pg-btn:hover:not(:disabled) {
  background: var(--accent-dim, rgba(56,163,245,0.15));
  color: var(--accent, #38a3f5);
  border-color: var(--border-accent, rgba(56,163,245,0.3));
}
.pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pg-btn.active {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-alt, #38a3f5) 100%) !important;
  color: #fff !important; border-color: transparent !important; font-weight: 600;
}
</style>