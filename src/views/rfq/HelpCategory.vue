<script setup>
import { computed, ref } from "vue";
import AppLayout from "../../layouts/AppLayout.vue";
import CategoryCard from "../../components/help/CategoryCard.vue";
import CategoryModal from "../../components/help/CategoryModal.vue";
import { supportedLocales, setLocale } from "../../i18n";
import { useI18n } from "vue-i18n";
import { useThemeStore, themes } from "../../stores/useThemeStore.js";

const theme = useThemeStore();

const { t, locale } = useI18n();
const langOptions = supportedLocales;

const lang = computed({
  get: () => locale.value,
  set: (value) => {
    setLocale(value);
  },
});


const selected = ref(null);

/* ── Category data ── */
const categories = ref([
  {
    id: "project-revenue",
    nameKey: "category-name.name-project-revenue",
    codes: [
      { code: "PS", descKey: "codes.desc-project-revenue" }
    ]
  },
  {
    id: "lpg",
    nameKey: "category-name.name-lpg-5year",
    codes: [
      { code: "PS", descKey: "codes.desc-lpg-5year" }
    ]
  },
  {
    id: "calibration",
    nameKey: "category-name.name-calibration",
    codes: [
      { code: "SE", descKey: "codes.desc-service-charge" }
    ]
  },
  {
    id: "project-expense",
    nameKey: "category-name.name-project-expense",
    codes: [
      { code: "SE", descKey: "codes.desc-service-charge" },
      { code: "PM", descKey: "codes.desc-pm" }
    ]
  },
  {
    id: "trading-cylinder",
    nameKey: "category-name.name-trading-cylinder",
    codes: [
      { code: "TC", descKey: "codes.desc-trading-gas-cylinder" }
    ]
  },
  {
    id: "trading-bulk",
    nameKey: "category-name.name-trading-bulk",
    codes: [
      { code: "TB", descKey: "codes.desc-trading-gas-bulk" }
    ]
  },
  {
    id: "fix-asset-cylinder",
    nameKey: "category-name.name-fix-asset-cylinder",
    codes: [
      { code: "AC", descKey: "codes.desc-fixed-asset-gas" }
    ]
  },
  {
    id: "expense",
    nameKey: "category-name.name-expense",
    codes: [
      { code: "SE", descKey: "codes.desc-service-charge" },
      { code: "EX", descKey: "codes.desc-expense-general" }
    ]
  },
  {
    id: "spare-parts",
    nameKey: "category-name.name-spare-parts",
    codes: [
      { code: "CS", descKey: "codes.desc-central-store" }
    ]
  },
  {
    id: "fix-asset",
    nameKey: "category-name.name-fix-asset",
    codes: [
      { code: "FA", descKey: "codes.desc-fixed-asset-specified" }
    ]
  },
]);

</script>

<template>
  <AppLayout :title="t('help.title')" role="User" email="user.a@itg.co.th">

    <div class="hc-page">

    
      <div class="page-header">
        <div class="header-text">
          <p class="header-hint">{{ t('help.hint') }}</p>
          <h2 class="header-title">{{ t('help.subtitle') }}</h2>
        </div>

      
      </div>

      <div class="cat-grid">
        <CategoryCard
          v-for="cat in categories"
          :key="cat.id"
          :category="cat"
          :lang="lang"
          @select="selected = $event"
        />
      </div>

    </div>

    <CategoryModal
      :category="selected"
      :lang="lang"
      @close="selected = null"
    />

  </AppLayout>
 
</template>

<style scoped>

.hc-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 28px 32px;
  overflow-y: auto;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.header-text { display: flex; flex-direction: column; gap: 4px; }
.header-hint {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted, rgba(255,255,255,0.35));
  margin: 0;
  font-family: "DM Sans", sans-serif;
}
.header-title {
  font-family: "Sora", sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0;
  letter-spacing: 0.01em;
}


.lang-opt {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 7px;
  border: none;
  background: none;
  color: var(--text-secondary, rgba(255,255,255,0.65));
  font-size: 12px;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  letter-spacing: 0.04em;
}
.lang-opt:hover {
  background: var(--bg-surface, rgba(255,255,255,0.04));
  color: var(--text-primary, #fff);
}
.lang-opt.active {
  background: var(--accent-dim, rgba(56,163,245,0.15));
  color: var(--accent, #38a3f5);
}


.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
</style>