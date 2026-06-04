<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

/* ── v-model:filters ── */
const props = defineProps({
  filters: {
    type: Object,
    required: true,
    // { rfqNo, type, list, status, contactUser }
  },
});

const emit = defineEmits(["update:filters", "search", "clear"]);

function update(key, value) {
  emit("update:filters", { ...props.filters, [key]: value });
}

function goSearch() {
  emit("search");
}

function clearFilters() {
  emit("update:filters", {
    rfqNo: "",
    type: "",
    list: "",
    status: "",
    contactUser: "",
  });
  emit("clear");
}
</script>

<template>
  <div class="filter-bar">
    <!-- RFQ No. -->
    <div class="filter-group">
      <label class="filter-label">RFQ No.</label>
      <input
        :value="filters.rfqNo"
        class="filter-input"
        placeholder="RFQ-yymmxxx"
        @input="update('rfqNo', $event.target.value)"
        @keyup.enter="goSearch"
      />
    </div>

    <!-- Type -->
    <div class="filter-group">
      <label class="filter-label">Type</label>
      <input
        :value="filters.type"
        class="filter-input w-sm"
        placeholder="LPG"
        @input="update('type', $event.target.value)"
        @keyup.enter="goSearch"
      />
    </div>

    <!-- List -->
    <div class="filter-group">
      <label class="filter-label">List</label>
      <input
        :value="filters.list"
        class="filter-input"
        placeholder="AAAAAAAA"
        @input="update('list', $event.target.value)"
        @keyup.enter="goSearch"
      />
    </div>

    <!-- Status -->
    <div class="filter-group">
      <label class="filter-label">Status</label>
      <div class="select-wrap">
        <select
          :value="filters.status"
          class="filter-select"
          @change="update('status', $event.target.value)"
        >
          <option value="">All</option>
          <option>Accept</option>
          <option>Waiting</option>
          <option>Resent</option>
          <option>Cancel</option>
          
        </select>
        <svg class="select-arrow" width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <!-- Contact User -->
    <div class="filter-group">
      <label class="filter-label">Contact User</label>
      <input
        :value="filters.contactUser"
        class="filter-input w-lg"
        placeholder="user.a@itg.co.th"
        @input="update('contactUser', $event.target.value)"
        @keyup.enter="goSearch"
      />
    </div>

     <button
        class="btn-icon btn-clear"
        title="Clear filters"
        @click="clearFilters"
      >
        <i class="pi pi-times-circle" style="color: red"></i>
      </button>

    <!-- Actions -->
    <div class="actions">
     
      <button
        class="btn-icon btn-add"
        title="Add new RFQ"
        @click="router.push('/doc-request/create')"
        aria-label="Add new"
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 28px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-family: "DM Sans", sans-serif;
}

.filter-input {
  height: 34px;
  padding: 0 12px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #fff;
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  width: 130px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.filter-input::placeholder { color: rgba(255,255,255,0.25); }
.filter-input:focus {
  border-color: rgba(56,163,245,0.5);
  box-shadow: 0 0 0 3px rgba(56,163,245,0.1);
}
.filter-input.w-sm { width: 90px; }
.filter-input.w-lg { width: 160px; }

.select-wrap { position: relative; }
.filter-select {
  appearance: none;
  height: 34px;
  padding: 0 32px 0 12px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #fff;
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  width: 120px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.filter-select:focus { border-color: rgba(56,163,245,0.5); }
.filter-select option { background: #0d1428; color: #fff; }
.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.4);
  pointer-events: none;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.btn-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.15s;
  font-size: 18px;
  font-family: "DM Sans", sans-serif;
}
.btn-icon:hover { transform: translateY(-1px); }

.btn-clear {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.4);
}
.btn-clear:hover {
  background: rgba(239,68,68,0.12);
  border-color: rgba(248,113,113,0.35);
  color: #f87171;
}

.btn-add {
  background: rgba(255,255,255,0.07);
  border-color: rgba(56,163,245,0.4);
  color: #38a3f5;
}
.btn-add:hover { background: rgba(56,163,245,0.15); }
</style>