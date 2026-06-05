<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps({
  category: { type: Object, default: null }, // null = hidden
  lang:     { type: String, default: "en" },
});

const emit = defineEmits(["close"]);

const show = computed(() => !!props.category);

function confirm() {
  if (!props.category) return;
  // ส่ง category code ตัวแรกไปกับ query param
  const code = props.category.codes[0]?.code ?? "";
 // router.push(`/doc-request/create?category=${code}`);
  emit("close");
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-box">

        

      
        <div class="modal-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>

      
        <p class="modal-label">Selected Category</p>
        <h2 class="modal-title">
          {{ category?.name[lang] || category?.name.en }}
        </h2>

        <div class="modal-divider" />

       
        <div class="modal-codes">
          <div
            v-for="c in category?.codes"
            :key="c.code"
            class="modal-code-row"
          >
            <span class="modal-code-badge">{{ c.code }}</span>
            <div class="modal-code-info">
              <span class="modal-code-en">{{ c.desc.en }}</span>
              <span v-if="c.desc.th" class="modal-code-th">{{ c.desc.th }}</span>
            </div>
          </div>
        </div>

        <div class="modal-divider" />

        
        <div class="modal-actions">
          <button class="btn-cancel" @click="emit('close')">Cancel</button>
          <button class="btn-confirm" @click="confirm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            Create Document
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}


.modal-box {
  position: relative;
  background: var(--bg-base, #0d1428);
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  border-radius: 20px;
  padding: 32px 28px 28px;
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow, 0 24px 60px rgba(0,0,0,0.5));
  font-family: "DM Sans", sans-serif;
}



.modal-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #38a3f5);
  margin-bottom: 16px;
}


.modal-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent, #38a3f5);
  margin: 0 0 6px;
}
.modal-title {
  font-family: "Sora", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0;
  line-height: 1.3;
}


.modal-divider {
  height: 1px;
  background: var(--bg-surface, rgba(255,255,255,0.04));
  margin: 20px 0;
}


.modal-codes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal-code-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.modal-code-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent, #38a3f5);
  background: var(--accent-dim, rgba(56,163,245,0.15));
  border: 1px solid var(--border-accent, rgba(56,163,245,0.3));
  border-radius: 6px;
  padding: 3px 9px;
  letter-spacing: 0.06em;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 1px;
}
.modal-code-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.modal-code-en {
  font-size: 13px;
  color: var(--text-primary, #fff);
  line-height: 1.4;
}
.modal-code-th {
  font-size: 12px;
  color: var(--text-muted, rgba(255,255,255,0.35));
  line-height: 1.4;
}


.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.btn-cancel {
  height: 38px;
  padding: 0 20px;
  border-radius: 10px;
  background: var(--bg-surface, rgba(255,255,255,0.04));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  color: var(--text-secondary, rgba(255,255,255,0.65));
  font-size: 13px;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-cancel:hover {
  background: var(--bg-elevated, rgba(255,255,255,0.08));
  color: var(--text-primary, #fff);
}
.btn-confirm {
  height: 38px;
  padding: 0 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-alt) 100%);
  border: none;
  color: var(--text-primary, #fff);
  font-size: 13px;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
  transition: opacity 0.2s, transform 0.15s;
}
.btn-confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}


.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-fade-enter-from,
.modal-fade-leave-to     { opacity: 0; transform: scale(0.96); }
</style>