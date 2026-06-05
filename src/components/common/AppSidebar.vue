<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
const router = useRouter();


const auth = useAuthStore();

function logout() {
  auth.logout();        
  router.push("/login");
}

const RFQLogo =
  "https://res.cloudinary.com/dxoiu2cn5/image/upload/v1780541755/image-removebg-preview_hlrefl.png";

const hovered = ref(false);

const navItems = [
  {
    to: "/doc-request-user",
    label: "Doc Request",
    icon: `<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
           <polyline points="14 2 14 8 20 8"/>
           <line x1="16" y1="13" x2="8" y2="13"/>
           <line x1="16" y1="17" x2="8" y2="17"/>
           <polyline points="10 9 9 9 8 9"/>`,
  },
  {
    to: "/help-category",
    label: "Help Category",
    icon: `<rect x="3" y="3" width="7" height="7"/>
           <rect x="14" y="3" width="7" height="7"/>
           <rect x="14" y="14" width="7" height="7"/>
           <rect x="3" y="14" width="7" height="7"/>`,
  },
 {
  to: "/theme",
  label: "Theme",
  icon: `
    <path d="M12 2C6.48 2 2 6.03 2 11c0 2.5 1.19 4.74 3.08 6.32C6.24 18.31 7.56 19 9 19h1c.55 0 1 .45 1 1 0 1.66 1.34 3 3 3 4.97 0 9-4.48 9-10S17.52 2 12 2z"/>
    <circle cx="6.5" cy="11.5" r="1.5"/>
    <circle cx="9.5" cy="7.5" r="1.5"/>
    <circle cx="14.5" cy="7.5" r="1.5"/>
    <circle cx="17.5" cy="11.5" r="1.5"/>
  `,
}
];
</script>

<template>
  <aside
    :class="['sidebar', { expanded: hovered }]"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- Logo -->
    <div class="sb-logo">
      <img :src="RFQLogo" alt="Smart RFQ" class="sb-logo-img" />
      <Transition name="fade-text">
        <span v-if="hovered" class="sb-logo-text">Smart RFQ</span>
      </Transition>
    </div>

    <div class="sb-divider" />

    <!-- Nav -->
    <nav class="sb-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sb-item"
        active-class="active"
      >
        <span class="sb-item-indicator" />
        <svg
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="item.icon"
        />
        <Transition name="fade-text">
          <span v-if="hovered" class="sb-label">{{ item.label }}</span>
        </Transition>
      </router-link>
    </nav>

    <div style="flex:1" />

    <!-- Logout -->
    <div class="sb-divider" />
    <button
      class="sb-item sb-logout"
      title="Logout"
      @click="logout"
    >
      <svg
        width="20" height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <Transition name="fade-text">
        <span v-if="hovered" class="sb-label">Logout</span>
      </Transition>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 62px;
  min-height: 100vh;
  background: var(--bg-elevated, rgba(255,255,255,0.05));
  border-right: 1px solid var(--border, rgba(255,255,255,0.08));
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 20px;
  transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
  overflow: hidden;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 20;
  font-family: "DM Sans", sans-serif;
}
.sidebar.expanded { width: 170px; }

/* Logo */
.sb-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  margin-bottom: 10px;
  width: 100%;
  overflow: hidden;
}
.sb-logo-img {
  width: 34px; height: 34px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--bg-surface, rgba(255,255,255,0.12));
  padding: 2px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px var(--accent-glow, rgba(56,163,245,0.3)));
}
.sb-logo-text {
  font-family: "Sora", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-h, #fff);
  white-space: nowrap;
}

.sb-divider {
  width: calc(100% - 24px);
  height: 1px;
  background: var(--bg-secondary, rgba(255,255,255,0.08));
  margin: 6px 0 12px;
  flex-shrink: 0;
}

/* Nav */
.sb-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 0 8px;
}
.sb-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 10px 14px;
  border-radius: 10px;
  color: var(--text-muted, rgba(255,255,255,0.45));
  text-decoration: none;
  position: relative;
  transition: background 0.18s, color 0.18s;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  background: none;
  border: none;
  font-family: "DM Sans", sans-serif;
  width: 100%;
}
.sb-item:hover {
  background: var(--accent-dim, rgba(56,163,245,0.1));
  color: var(--text, rgba(255,255,255,0.8));
}
.sb-item.active {
  background: var(--accent-bg, rgba(56,163,245,0.18));
  color: var(--accent, #38a3f5);
}
.sb-item-indicator {
  position: absolute;
  left: 0; top: 25%; bottom: 25%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: transparent;
  transition: background 0.18s;
}
.sb-item.active .sb-item-indicator { background: var(--accent, #38a3f5); }
.sb-label {
  font-size: 13px;
  font-weight: 500;
  color: inherit;
}

/* Logout */
.sb-logout {
  color: var(--text-muted, rgba(255,100,100,0.55));
  margin: 0 8px;
  width: calc(100% - 16px);
}
.sb-logout:hover {
  background: rgba(239,68,68,0.12);
  color: #f87171;
}

/* Transitions */
.fade-text-enter-active,
.fade-text-leave-active  { transition: opacity 0.15s; }
.fade-text-enter-from,
.fade-text-leave-to      { opacity: 0; }
</style>