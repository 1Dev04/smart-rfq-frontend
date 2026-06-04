<script setup>
defineProps({
  text: { type: String, default: "Create by 1DEV" },
});
</script>

<template>
  <footer class="app-footer">
    <span>{{ text }}</span>
  </footer>
</template>

<style scoped>
.app-footer {
  text-align: center;
  padding: 8px;
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  border-top: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.02);
  flex-shrink: 0;
  font-family: "DM Sans", sans-serif;
}
</style>