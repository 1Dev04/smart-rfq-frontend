<script setup>
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { supportedLocales, setLocale } from "../../i18n";


const router = useRouter();

const { t, locale } = useI18n();
const langOptions = supportedLocales;

const lang = computed({
  get: () => locale.value,
  set: (value) => {
    setLocale(value);
  },
});


const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:filters", "search", "clear", "open-drawer"]);

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

function openDrawer() {
  emit("open-drawer");
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-group">
      <label class="filter-label">{{ t('doc-req-dashboard.rfq-no') }}</label>
      <input
        :value="filters.rfqNo"
        class="filter-input"
        placeholder="RFQ-yymmxxx"
        @input="update('rfqNo', $event.target.value)"
        @keyup.enter="goSearch"
      />
    </div>

    <div class="filter-group">
      <label class="filter-label">{{ t('doc-req-dashboard.type') }}</label>
      <input
        :value="filters.type"
        class="filter-input w-sm"
        placeholder="LPG"
        @input="update('type', $event.target.value)"
        @keyup.enter="goSearch"
      />
    </div>

    <div class="filter-group">
      <label class="filter-label">{{ t('doc-req-dashboard.list') }}</label>
      <input
        :value="filters.list"
        class="filter-input"
        placeholder="AAAAAAAA"
        @input="update('list', $event.target.value)"
        @keyup.enter="goSearch"
      />
    </div>

    <div class="filter-group">
      <label class="filter-label">{{ t('doc-req-dashboard.status') }}</label>
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
          <option>Reject</option>
          <option>Cancel</option>
        </select>
        <svg
          class="select-arrow"
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>

    <div class="filter-group">
      <label class="filter-label">{{ t('doc-req-dashboard.contact-user') }}</label>
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
      <i class="pi pi-times-circle"></i>
    </button>

    <div class="actions">
      <button
        class="btn-icon btn-add"
        title="Add new RFQ"
        @click="openDrawer"
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
  background: var(--bg-surface, rgba(255, 255, 255, 0.04));
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
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
  color: var(--text-muted, rgba(255, 255, 255, 0.35));
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-family: "DM Sans", sans-serif;
}

.filter-input {
  height: 34px;
  padding: 0 12px;
  background: var(--bg-elevated, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  width: 130px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.filter-input::placeholder {
  color: var(--text-muted, rgba(255, 255, 255, 0.35));
}
.filter-input:focus {
  border-color: var(--border-accent, rgba(56, 163, 245, 0.3));
  box-shadow: 0 0 0 3px var(--accent-dim, rgba(56, 163, 245, 0.15));
}
.filter-input.w-sm {
  width: 90px;
}
.filter-input.w-lg {
  width: 160px;
}

.select-wrap {
  position: relative;
}
.filter-select {
  appearance: none;
  height: 34px;
  padding: 0 32px 0 12px;
  background: var(--bg-elevated, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  width: 120px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.filter-select:focus {
  border-color: var(--border-accent, rgba(56, 163, 245, 0.3));
}
.filter-select option {
  background: var(--bg-base, #0d1428);
  color: var(--text-primary, #fff);
}
.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted, rgba(255, 255, 255, 0.35));
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
  transition:
    background 0.2s,
    transform 0.15s;
  font-size: 18px;
  font-family: "DM Sans", sans-serif;
}
.btn-icon:hover {
  transform: translateY(-1px);
}

.btn-clear {
  background: var(--bg-surface, rgba(255, 255, 255, 0.04));
  border-color: var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-secondary, rgba(255, 255, 255, 0.65));
}
.btn-clear:hover {
  background: var(--accent-dim, rgba(56, 163, 245, 0.15));
  border-color: var(--border-accent, rgba(56, 163, 245, 0.3));
  color: var(--accent, #38a3f5);
}

.btn-add {
  background: var(--accent-dim, rgba(56, 163, 245, 0.15));
  border-color: var(--border-accent, rgba(56, 163, 245, 0.3));
  color: var(--accent, #38a3f5);
}
.btn-add:hover {
  background: var(--accent-glow, rgba(56, 163, 245, 0.25));
}
</style>
