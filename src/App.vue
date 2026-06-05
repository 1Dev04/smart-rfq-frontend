
<script setup>
import { ref, onMounted } from 'vue'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import { RouterView } from 'vue-router'
import { useThemeStore } from "./stores/useThemeStore.js";
useThemeStore();

const loading = ref(true)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 3000)
})
</script>

<template>
 
  <div class="mobile-block">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="12" y1="18" x2="12" y2="18.5" stroke-linecap="round" stroke-width="2"/>
    </svg>
    <p class="mb-title">Smart RFQ</p>
    <p class="mb-sub">รองรับเฉพาะ Desktop (1024px ขึ้นไป)</p>
    <p class="mb-hint">กรุณาเปิดบน คอมพิวเตอร์หรือ แล็ปท็อป</p>
  </div>

 
  <div class="desktop-only">
    
    <Transition name="fade">
      <div v-if="loading" class="loading-screen">
        <div class="loading-bg-glow" />

        <div class="loading-content">
          <img
            src="https://res.cloudinary.com/dxoiu2cn5/image/upload/v1780472550/image0-removebg-preview_vcjesh.png"
            alt="Smart RFQ"
            class="loading-logo"
          />

          <DotLottieVue
            class="loading-lottie"
            autoplay
            loop
            src="https://lottie.host/1d1dffe4-9ac3-419e-a4a3-7daa033737aa/0hbDu2YUsK.lottie"
          />

          <div class="loading-bottom">
            <div class="loading-bar-wrap">
              <div class="loading-bar" />
            </div>
            <p class="loading-text">Intelligent Sourcing. Streamlined Quoting.</p>
          </div>
        </div>
      </div>
    </Transition>

   
    <div v-if="!loading" class="app-ready">
      <RouterView />
    </div>
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
.mb-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0;
}
.mb-sub {
  font-size: 15px;
  color: var(--text);
  margin: 0;
}
.mb-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}


.desktop-only {
  display: none;
}

@media (max-width: 1023px) {
  .mobile-block  { display: flex; }
  .desktop-only  { display: none !important; }
}
@media (min-width: 1024px) {
  .mobile-block  { display: none; }
  .desktop-only  { display: block; }
}


.loading-screen {
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}


.loading-bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--rfq-navy-50) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.loading-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.loading-logo {
  width: 660px;
  object-fit: contain;
  animation: fadeSlideUp 0.7s ease both;
  position: relative;
  z-index: 1;
}

.loading-lottie {
  width: 180px;
  height: 180px;
  margin-top: -30px;
  opacity: 0.9;
}

.loading-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  animation: fadeSlideUp 0.7s ease 0.4s both;
}

.loading-bar-wrap {
  width: 260px;
  height: 3px;
  background: var(--rfq-neutral-100);
  border-radius: 99px;
  overflow: hidden;
}

.loading-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(
    90deg,
    var(--rfq-navy-600),
    var(--rfq-sky-400)
  );
  border-radius: 99px;
  animation: loadProgress 2.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.loading-text {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
}


.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

@keyframes loadProgress {
  0%   { width: 0%; }
  50%  { width: 65%; }
  85%  { width: 90%; }
  100% { width: 100%; }
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}


@media (prefers-color-scheme: dark) {
  .loading-bg-glow {
    background: radial-gradient(
      circle,
      rgba(37, 99, 196, 0.12) 0%,
      transparent 70%
    );
  }
}
</style>