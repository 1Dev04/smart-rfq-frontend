<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { supportedLocales, setLocale } from "../../i18n";

const { t, locale } = useI18n();
const langOptions = supportedLocales;

const lang = computed({
  get: () => locale.value,
  set: (value) => {
    setLocale(value);
  },
});

defineProps({
  category: { type: Object, required: true },
  lang:     { type: String, default: "en" },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <div class="cat-card" @click="emit('select', category)">

    <div class="card-glow" />

   
    <div class="card-header">
      <div class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
     <h3 class="card-title">{{ t(category.nameKey) }}</h3>
    </div>


    <div class="card-codes">
      <div
        v-for="c in category.codes"
        :key="c.code"
        class="code-row"
      >
        <span class="code-badge">{{ c.code }}</span>
        <span class="code-desc">{{ t(c.descKey) }}</span>
      </div>
    </div>

    
    <div class="card-footer">
      <span class="footer-hint">{{ t('category-card.click-select') }}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.cat-card {
  position: relative;
  background: var(--bg-surface, rgba(255,255,255,0.04));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1),
              border-color 0.25s,
              background 0.25s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cat-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-accent, rgba(56,163,245,0.3));
  background: var(--accent-dim, rgba(56,163,245,0.15));
}


.card-glow {
  position: absolute;
  inset: -1px;
  border-radius: 16px;
  background: radial-gradient(circle at 50% 0%, var(--accent-glow, rgba(56,163,245,0.25)) 0%, transparent 65%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.cat-card:hover .card-glow { opacity: 1; }


.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.card-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #38a3f5);
  flex-shrink: 0;
  transition: background 0.2s;
}
.cat-card:hover .card-icon {
  background: var(--accent-glow, rgba(56,163,245,0.25));
}
.card-title {
  font-family: "Sora", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin: 0;
  line-height: 1.4;
  padding-top: 2px;
}


.card-codes {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1),
              opacity 0.25s;
}
.cat-card:hover .card-codes {
  max-height: 200px;
  opacity: 1;
}
.code-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.code-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent, #38a3f5);
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  border-radius: 5px;
  padding: 2px 7px;
  letter-spacing: 0.06em;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 1px;
}
.code-desc {
  font-size: 11.5px;
  color: var(--text-secondary, rgba(255,255,255,0.65));
  line-height: 1.45;
}


.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  margin-top: auto;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.2s, transform 0.2s;
  color: var(--accent, #38a3f5);
}
.cat-card:hover .card-footer {
  opacity: 1;
  transform: translateY(0);
}
.footer-hint {
  font-size: 11px;
  font-weight: 500;
  font-family: "DM Sans", sans-serif;
}
</style>