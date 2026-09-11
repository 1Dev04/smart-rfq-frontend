<script setup>
import { RouterView } from "vue-router";
import { useThemeStore } from "./stores/useThemeStore.js";
import Toast from "primevue/toast";

useThemeStore();
</script>

<template>
  <div class="mobile-block">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18.5" stroke-linecap="round" stroke-width="2" />
    </svg>
    <p class="mb-title">Smart RFQ</p>
    <p class="mb-sub">รองรับเฉพาะ Desktop (1024px ขึ้นไป)</p>
    <p class="mb-hint">กรุณาเปิดบน คอมพิวเตอร์หรือ แล็ปท็อป</p>
  </div>

  <div class="desktop-only">
    <Toast />
    <RouterView />
  </div>
</template>

<style scoped>
.mobile-block {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 100svh;
  padding: 2rem;
  text-align: center;
  background: var(--bg);
  color: var(--text-muted);
}
.mb-title { font-size: 20px; font-weight: 600; color: var(--text-h); margin: 0; }
.mb-sub   { font-size: 15px; color: var(--text); margin: 0; }
.mb-hint  { font-size: 13px; color: var(--text-muted); margin: 0; }

.desktop-only { display: none; }

@media screen and (max-width: 1023px) {
  .mobile-block  { display: flex; }
  .desktop-only  { display: none !important; }
}
@media screen and (min-width: 1024px) {
  .mobile-block  { display: none; }
  .desktop-only  { display: block; }
}

@media print {
  .mobile-block  { display: none !important; }
  .desktop-only  { display: block !important; }
}


</style>