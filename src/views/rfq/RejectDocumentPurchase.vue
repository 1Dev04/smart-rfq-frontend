<script setup>
import { ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { apiFetch } from "../../utils/api";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  docRequestId: { type: [Number, String], default: null },
  rfqNo: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "rejected"]);

const BASE = `${import.meta.env.VITE_API_URL}`;
const toast = useToast();

const reason = ref("");
const isSubmitting = ref(false);

function close() {
  if (isSubmitting.value) return;
  reason.value = "";
  emit("update:modelValue", false);
}

async function confirmReject() {
  if (!props.docRequestId) return;
  isSubmitting.value = true;
  try {
    
    const res = await apiFetch(
      `${BASE}/api/doc-request/${props.docRequestId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason: reason.value?.trim() || null }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.add({
        severity: "error",
        summary: "Reject failed",
        detail: body.message ?? `Server error (HTTP ${res.status})`,
        life: 6000,
      });
      return;
    }

    const result = await res.json().catch(() => ({}));

    toast.add({
      severity: "warn",
      summary: "Rejected",
      detail: `RFQ ${result.rfqNo ?? props.rfqNo ?? ""} ถูกตีกลับให้ผู้ขอแก้ไข`,
      life: 4000,
    });

   
    emit("rejected", {
      docRequestId: props.docRequestId,
      rfqNo: result.rfqNo ?? props.rfqNo,
      newRev: result.newRev,
      status: "user_pending", 
    });

    reason.value = "";
    emit("update:modelValue", false);
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Network error",
      detail: err.message,
      life: 6000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

// เคลียร์เหตุผลทุกครั้งที่เปิด modal ใหม่
watch(
  () => props.modelValue,
  (val) => {
    if (val) reason.value = "";
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="reject-fade">
      <div
        v-if="modelValue"
        class="reject-overlay"
        @click.self="close"
      >
        <div class="reject-modal" role="dialog" aria-modal="true">
          <div class="reject-header">
            <div class="reject-icon">
              <i class="pi pi-times-circle"></i>
            </div>
            <div>
              <h3 class="reject-title">Reject RFQ</h3>
              <span class="reject-sub">{{ rfqNo }}</span>
            </div>
            <button class="reject-close" :disabled="isSubmitting" @click="close">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="reject-body">
            <p class="reject-desc">
              RFQ นี้จะถูกตีกลับไปให้ผู้ขอ (Requester) แก้ไขข้อมูลใหม่
              และสถานะจะเปลี่ยนเป็น <strong>"User Pending"</strong> อีกครั้ง
            </p>
            <label class="reject-label">เหตุผลในการ Reject (ไม่บังคับ)</label>
            <textarea
              v-model="reason"
              class="reject-textarea"
              rows="4"
              maxlength="500"
              placeholder="ระบุเหตุผล เช่น ข้อมูลไม่ครบ, ราคาไม่เหมาะสม..."
            />
          </div>

          <div class="reject-footer">
            <button
              class="reject-btn reject-btn--ghost"
              :disabled="isSubmitting"
              @click="close"
            >
              Cancel
            </button>
            <button
              class="reject-btn reject-btn--danger"
              :disabled="isSubmitting"
              @click="confirmReject"
            >
              <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
              Confirm Reject
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.reject-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.reject-fade-enter-active,
.reject-fade-leave-active {
  transition: opacity 0.2s ease;
}
.reject-fade-enter-from,
.reject-fade-leave-to {
  opacity: 0;
}

.reject-modal {
  width: 420px;
  max-width: calc(100vw - 32px);
  background: var(--bg-base, #0d1428);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  font-family: "DM Sans", sans-serif;
  overflow: hidden;
}

.reject-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
}
.reject-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.reject-title {
  font-family: "Sora", sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0 0 2px;
}
.reject-sub {
  font-size: 11.5px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
}
.reject-close {
  margin-left: auto;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, rgba(255, 255, 255, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.reject-close:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
.reject-close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.reject-body {
  padding: 18px 20px;
}
.reject-desc {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary, rgba(255, 255, 255, 0.65));
  margin: 0 0 14px;
}
.reject-desc strong {
  color: var(--accent, #38a3f5);
}
.reject-label {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted, rgba(255, 255, 255, 0.45));
  margin-bottom: 6px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.reject-textarea {
  width: 100%;
  resize: vertical;
  min-height: 90px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.09));
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 13px;
  padding: 8px 11px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.reject-textarea:focus {
  border-color: #f87171;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
}
.reject-textarea::placeholder {
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
}

.reject-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
}
.reject-btn {
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.18s;
}
.reject-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.reject-btn--ghost {
  background: transparent;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
}
.reject-btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary, #fff);
}
.reject-btn--danger {
  border: none;
  color: #fff;
  font-family: "Sora", sans-serif;
  font-weight: 700;
  background: linear-gradient(135deg, #7f1d1d, #ef4444);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
}
.reject-btn--danger:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}
</style>