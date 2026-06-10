<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from '../../stores/auth.js'
import { useThemeStore } from '../../stores/useThemeStore.js'

const themeStore = useThemeStore()

const props = defineProps({
  title: { type: String, default: "Dashboard" },
});

const auth = useAuthStore()

const displayRole  = computed(() => auth.role  || 'User')
const displayEmail = computed(() => auth.user?.email || 'user@itg.co.th')

const { locale } = useI18n();
const lang = computed({
  get: () => locale.value,
  set: (value) => {
    locale.value = value;
    localStorage.setItem("lang", value);
    document.documentElement.lang = value;
  },
});
const langs = [
  { code: "th", flag: "🇹🇭", label: "ไทย" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "ja", flag: "🇯🇵", label: "日本語" },
];
const showLangMenu = ref(false);
const currentLang = computed(() => langs.find((l) => l.code === lang.value) || langs[1]);
const avatarUrl = computed(() => {

  const _theme = themeStore.themeId
  const _dark  = themeStore.isDark

  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent')
    .trim()
    .replace('#', '')

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayEmail.value)}&background=${accent}&color=ffffff&rounded=true&size=48`
})
</script>

<template>
  <header class="topbar">
    <h1 class="page-title">{{ title }}</h1>
    <div class="topbar-right">
      <div class="lang-picker">
        <button class="lang-btn" @click="showLangMenu = !showLangMenu">
          <span>{{ currentLang.flag }}</span>
          <span>{{ currentLang.label }}</span>
          <svg
            :class="['chevron', { open: showLangMenu }]"
            width="11" height="11"
            viewBox="0 0 12 12" fill="none"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <Transition name="menu-drop">
          <div v-if="showLangMenu" class="lang-menu">
            <button
              v-for="l in langs"
              :key="l.code"
              class="lang-item"
              :class="{ active: lang === l.code }"
              @click="lang = l.code; showLangMenu = false"
            >
              <span>{{ l.flag }}</span>
              <span>{{ l.label }}</span>
              <svg
                v-if="lang === l.code"
                style="margin-left:auto"
                width="13" height="13"
                viewBox="0 0 14 14" fill="none"
              >
                <path
                  d="M2.5 7L5.5 10L11.5 4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </Transition>
      </div>

      <div class="profile-chip">
        <img :src="avatarUrl" :alt="displayRole" class="profile-avatar" />
        <div class="profile-text">
          <span class="profile-role">{{ displayRole }}</span>
          <span class="profile-email">{{ displayEmail }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: var(--bg-elevated, rgba(255,255,255,0.04));
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
  backdrop-filter: blur(16px);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 15;
  font-family: "DM Sans", sans-serif;
}

.page-title {
  font-family: "Sora", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-h, #fff);
  letter-spacing: 0.01em;
  margin: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Language picker */
.lang-picker { position: relative; }
.lang-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--bg-secondary, rgba(255,255,255,0.08));
  border: 1px solid var(--border, rgba(255,255,255,0.15));
  color: var(--text, rgba(255,255,255,0.9));
  padding: 7px 13px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: background 0.2s;
}
.lang-btn:hover { background: var(--accent-dim, rgba(255,255,255,0.13)); }

.chevron { opacity: 0.6; transition: transform 0.2s; }
.chevron.open { transform: rotate(180deg); }

.lang-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg, rgba(10,15,30,0.95));
  border: 1px solid var(--border, rgba(255,255,255,0.12));
  border-radius: 14px;
  overflow: hidden;
  min-width: 150px;
  backdrop-filter: blur(20px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.25);
  z-index: 100;
}
.lang-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  color: var(--text-muted, rgba(255,255,255,0.7));
  font-size: 13px;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition: background 0.15s;
}
.lang-item:hover {
  background: var(--accent-dim, rgba(56,163,245,0.12));
  color: var(--text-h, #fff);
}
.lang-item.active {
  background: var(--accent-bg, rgba(56,163,245,0.18));
  color: var(--accent, #38a3f5);
  font-weight: 500;
}


.profile-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--bg-secondary, rgba(255,255,255,0.06));
  border: 1px solid var(--border, rgba(255,255,255,0.08));
  box-shadow: 0 10px 24px rgba(0,0,0,0.18);
  backdrop-filter: blur(14px);
}
.profile-avatar {
  width: 38px; height: 38px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--orb-3, #60a5fa);
}
.profile-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.profile-role  { font-size: 12px; font-weight: 700; color: var(--text-h, #fff); }
.profile-email { font-size: 11px; color: var(--text-muted, rgba(255,255,255,0.65)); }


.menu-drop-enter-active,
.menu-drop-leave-active { transition: opacity 0.15s, transform 0.15s; }
.menu-drop-enter-from,
.menu-drop-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>