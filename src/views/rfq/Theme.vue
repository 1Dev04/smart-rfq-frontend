<script setup>
import AppLayout       from "../../layouts/AppLayout.vue";
import { useThemeStore, themes } from "../../stores/useThemeStore.js";
import { supportedLocales, setLocale } from "../../i18n";
import { useI18n } from "vue-i18n";
import { computed } from "vue"

const theme = useThemeStore();


const { t, locale } = useI18n();
const langOptions = supportedLocales;

const lang = computed({
  get: () => locale.value,
  set: (value) => {
    setLocale(value);
  },
});



</script>

<template>
  <AppLayout :title="t('theme.name-theme')" role="User" email="user.a@itg.co.th">
    <div class="st-page">

     
      <section class="section">
        <div class="section-header">
          <div class="section-title-group">
            <h3 class="section-title">{{ t('theme.section-title-theme') }}</h3>
            <p class="section-desc">{{ t('theme.section-desc-theme') }}</p>
          </div>
        </div>

        <div class="mode-toggle-row">
        
          <div
            :class="['mode-card', { active: theme.isDark }]"
            @click="!theme.isDark && theme.toggleDark()"
          >
            <div class="mode-preview mode-preview-dark">
              <div class="mp-sidebar" />
              <div class="mp-content">
                <div class="mp-bar" />
                <div class="mp-bar short" />
                <div class="mp-bar" />
              </div>
            </div>
            <div class="mode-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
              </svg>
              {{ t('theme.mode-moon') }}
              <span v-if="theme.isDark" class="mode-active-dot" />
            </div>
          </div>

         

      
          <div
            :class="['mode-card', { active: !theme.isDark }]"
            @click="theme.isDark && theme.toggleDark()"
          >
            <div class="mode-preview mode-preview-light">
              <div class="mp-sidebar light" />
              <div class="mp-content light">
                <div class="mp-bar light" />
                <div class="mp-bar light short" />
                <div class="mp-bar light" />
              </div>
            </div>
            <div class="mode-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              {{ t('theme.mode-sun') }}
              <span v-if="!theme.isDark" class="mode-active-dot" />
            </div>
          </div>
        </div>
      </section>

      <div class="section-divider" />

   
      <section class="section">
        <div class="section-header">
          <div class="section-title-group">
            <h3 class="section-title">{{ t('theme.name-color') }}</h3>
            <p class="section-desc">{{ t('theme.des-color') }}</p>
          </div>
          <span class="current-badge">
            {{ themes.find(t => t.id === theme.themeId)?.name }}
          </span>
        </div>

        <div class="theme-grid">
          <button
            v-for="t in themes"
            :key="t.id"
            :class="['theme-card', { active: theme.themeId === t.id }]"
            @click="theme.setTheme(t.id)"
          >
            
            <div class="swatch-row">
              <div
                v-for="(color, i) in t.preview"
                :key="i"
                class="swatch"
                :style="{ background: color }"
              />
            </div>

          
            <div class="theme-info">
              <span class="theme-name">{{ t.name }}</span>
              <span class="theme-desc">{{ t.desc }}</span>
            </div>

            
            <div v-if="theme.themeId === t.id" class="theme-check">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7L5.5 10L11.5 4"
                  stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </section>

      <div class="section-divider" />

   
      <section class="section">
        <div class="section-header">
          <div class="section-title-group">
            <h3 class="section-title">{{ t('theme.name-preview') }}</h3>
            <p class="section-desc">{{ t('theme.des-preview') }}</p>
          </div>
        </div>

        <div class="preview-box">
        
          <div class="pv-topbar">
            <div class="pv-title">{{ t('theme.name-dash') }}</div>
            <div class="pv-dot" />
          </div>
         
          <div class="pv-body">
            <div class="pv-sidebar">
              <div v-for="i in 4" :key="i" class="pv-nav-item" :class="{ active: i === 1 }" />
            </div>
            <div class="pv-main">
              <div class="pv-card">
                <div class="pv-bar w-60" />
                <div class="pv-bar w-40" />
              </div>
              <div class="pv-card">
                <div class="pv-bar w-80" />
                <div class="pv-bar w-50" />
              </div>
              <div class="pv-badge">{{ t('theme.preview-ac') }}</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

<style scoped>

.st-page {
  flex: 1;
  padding: 28px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  font-family: "DM Sans", sans-serif;
}

.section { padding: 24px 0; }
.section-divider {
  height: 1px;
  background: var(--border-subtle, rgba(255,255,255,0.07));
}


.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-title-group { display: flex; flex-direction: column; gap: 4px; }
.section-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0;
}
.section-desc {
  font-size: 12.5px;
  color: var(--text-muted, rgba(255,255,255,0.35));
  margin: 0;
}
.current-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent, #38a3f5);
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  border-radius: 6px;
  padding: 4px 10px;
}

.mode-toggle-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-card {
  flex: 1;
  border-radius: 14px;
  border: 2px solid var(--border-subtle, rgba(255,255,255,0.08));
  background: var(--bg-surface, rgba(255,255,255,0.04));
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}
.mode-card:hover { transform: translateY(-2px); }
.mode-card.active {
  border-color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 1px var(--accent-dim, rgba(56,163,245,0.15));
}

/* Mini preview inside card */
.mode-preview {
  height: 72px;
  display: flex;
  overflow: hidden;
}
.mode-preview-dark  { background: #0a0f1e; }
.mode-preview-light { background: #f0f6ff; }

.mp-sidebar {
  width: 20px;
  background: rgba(255,255,255,0.06);
  border-right: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}
.mp-sidebar.light {
  background: rgba(0,0,0,0.06);
  border-right-color: rgba(0,0,0,0.07);
}
.mp-content {
  flex: 1;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mp-bar {
  height: 7px;
  border-radius: 4px;
  background: rgba(255,255,255,0.12);
}
.mp-bar.short { width: 55%; }
.mp-bar.light { background: rgba(0,0,0,0.1); }

.mode-label {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, rgba(255,255,255,0.65));
  border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
}
.mode-card.active .mode-label { color: var(--accent, #38a3f5); }
.mode-active-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent, #38a3f5);
  margin-left: auto;
}

/* Big toggle switch */
.big-toggle {
  width: 52px; height: 52px;
  border-radius: 50%;
  border: 2px solid var(--border-accent, rgba(56,163,245,0.3));
  background: var(--accent-dim, rgba(56,163,245,0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, transform 0.2s;
  color: var(--accent, #38a3f5);
}
.big-toggle:hover {
  background: var(--accent-glow, rgba(56,163,245,0.25));
  transform: scale(1.1);
}
.toggle-knob {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}

/* ══════════════════════════════════════
   THEME GRID
══════════════════════════════════════ */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.theme-card {
  position: relative;
  border-radius: 14px;
  border: 2px solid var(--border-subtle, rgba(255,255,255,0.08));
  background: var(--bg-surface, rgba(255,255,255,0.04));
  padding: 14px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, transform 0.2s, background 0.2s;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-family: "DM Sans", sans-serif;
}
.theme-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-accent, rgba(56,163,245,0.3));
  background: var(--bg-elevated, rgba(255,255,255,0.07));
}
.theme-card.active {
  border-color: var(--accent, #38a3f5);
  background: var(--accent-dim, rgba(56,163,245,0.1));
}

/* Swatches */
.swatch-row {
  display: flex;
  gap: 5px;
}
.swatch {
  width: 22px; height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
}
.swatch:first-child { flex: 1; }

/* Info */
.theme-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.theme-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #fff);
}
.theme-desc {
  font-size: 11px;
  color: var(--text-muted, rgba(255,255,255,0.35));
  line-height: 1.4;
}

/* Active checkmark */
.theme-check {
  position: absolute;
  top: 10px; right: 10px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--accent, #38a3f5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

/* ══════════════════════════════════════
   LIVE PREVIEW BOX
══════════════════════════════════════ */
.preview-box {
  border-radius: 16px;
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  overflow: hidden;
  background: var(--bg-base, #0a0f1e);
}

.pv-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--bg-surface, rgba(255,255,255,0.04));
  border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
}
.pv-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  font-family: "Sora", sans-serif;
}
.pv-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 2px solid var(--border-accent, rgba(56,163,245,0.3));
}

.pv-body {
  display: flex;
  height: 110px;
}
.pv-sidebar {
  width: 36px;
  background: var(--bg-surface, rgba(255,255,255,0.04));
  border-right: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pv-nav-item {
  height: 6px;
  border-radius: 3px;
  background: var(--bg-elevated, rgba(255,255,255,0.08));
}
.pv-nav-item.active {
  background: var(--accent, #38a3f5);
  opacity: 0.7;
}

.pv-main {
  flex: 1;
  padding: 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.pv-card {
  flex: 1;
  background: var(--bg-surface, rgba(255,255,255,0.04));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pv-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--bg-elevated, rgba(255,255,255,0.1));
}
.pv-bar.w-40 { width: 40%; }
.pv-bar.w-50 { width: 50%; }
.pv-bar.w-60 { width: 60%; }
.pv-bar.w-80 { width: 80%; }

.pv-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent, #38a3f5);
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  border-radius: 5px;
  padding: 3px 8px;
  align-self: flex-end;
  margin-top: auto;
  font-family: "DM Sans", sans-serif;
}
</style>