<script setup>
import AppSidebar from "../components/common/AppSidebar.vue";
import AppTopbar  from "../components/common/AppTopbar.vue";
import AppFooter  from "../components/common/ AppFooter.vue";
defineProps({
  title: { type: String, default: "Doc Request" },
  role:  { type: String, default: "User" },
  email: { type: String, default: "user@itg.co.th" },
});
</script>

<template>
  <div class="al-root">

   
    <div class="bg-layer" aria-hidden="true">
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />
      <div class="grid-lines" />
    </div>

    
    <div class="shell">

    
      <AppSidebar />

      
      <div class="main-col">

       
        <AppTopbar :title="title" :role="role" :email="email" />

        
        <main class="page-content">
          <slot />
        </main>

       
        <AppFooter />

      </div>
    </div>

  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");


.al-root {
  min-height: 100vh;
  width: 100%;
  background: var(--bg, #0a0f1e);
  color: var(--text, #e8f6ff);
  font-family: "DM Sans", sans-serif;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}


.bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.45;
  animation: orbDrift ease-in-out infinite alternate;
}
.orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, var(--orb-1, #1a3d9e) 0%, transparent 70%);
  top: -200px; left: -150px;
  animation-duration: 16s;
}
.orb-2 {
  width: 450px; height: 450px;
  background: radial-gradient(circle, var(--orb-2, #0c4a8f) 0%, transparent 70%);
  bottom: -120px; right: -100px;
  animation-duration: 12s;
  animation-delay: -5s;
}
.orb-3 {
  width: 320px; height: 320px;
  background: radial-gradient(circle, var(--orb-3, #38a3f5) 0%, transparent 70%);
  top: 40%; left: 55%;
  opacity: 0.18;
  animation-duration: 18s;
  animation-delay: -9s;
}
@keyframes orbDrift {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(35px,25px) scale(1.07); }
}
.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(56,163,245,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56,163,245,0.04) 1px, transparent 1px);
  background-size: 52px 52px;
}


.shell {
  position: relative;
  z-index: 10;
  display: flex;
  flex: 1;
  min-height: 100vh;
}


.main-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}


.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  min-height: 0;
}
</style>