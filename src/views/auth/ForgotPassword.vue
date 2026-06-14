<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const LoginLogo =
  "https://res.cloudinary.com/dxoiu2cn5/image/upload/v1780472550/image0-removebg-preview_vcjesh.png";
const email = ref("");
const emailDomain = "@itg.co.th";
const loading = ref(false);
const success = ref(false);
const error = ref("");
let errorTimer = null;

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
  {
    code: "th",
    flag: "🇹🇭",
    label: "ภาษาไทย",
    title: "ลืมรหัสผ่าน?",
    subtitle: "กรอก Email ที่ลงทะเบียนไว้เพื่อรับลิงก์รีเซ็ตรหัสผ่าน",
    btn: "ส่งลิงก์รีเซ็ต",
    back: "กลับไปหน้าเข้าสู่ระบบ",
    placeholder: "ชื่อผู้ใช้",
    success_title: "ส่งลิงก์แล้ว!",
    success_msg: "กรุณาตรวจสอบ Email ของคุณ",
    err_empty: "กรุณากรอก Email",
    err_invalid: "รูปแบบ Email ไม่ถูกต้อง",
  },
  {
    code: "en",
    flag: "🇬🇧",
    label: "English",
    title: "Forgot Password?",
    subtitle: "Enter your registered email to receive a password reset link.",
    btn: "Send Reset Link",
    back: "Back to Login",
    placeholder: "username",
    success_title: "Link Sent!",
    success_msg: "Please check your email inbox.",
    err_empty: "Please enter your Email",
    err_invalid: "Invalid email format",
  },
  {
    code: "ja",
    flag: "🇯🇵",
    label: "日本語",
    title: "パスワードを忘れた？",
    subtitle:
      "パスワードリセットリンクを受け取るには登録済みのメールアドレスを入力してください。",
    btn: "リセットリンクを送信",
    back: "サインインに戻る",
    placeholder: "ユーザー名",
    success_title: "送信しました！",
    success_msg: "メールボックスを確認してください。",
    err_empty: "メールを入力してください",
    err_invalid: "メール形式が正しくありません",
  },
];
const showLangMenu = ref(false);
const currentLang = computed(
  () => langs.find((l) => l.code === lang.value) || langs[1],
);

const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,48}[a-zA-Z0-9]$/;

function setError(msg) {
  error.value = msg;
  clearTimeout(errorTimer);
  errorTimer = setTimeout(() => {
    error.value = "";
  }, 5000);
}

function sanitize(str) {
  return str.replace(/[<>'"`;\\\/\(\)\[\]\{\}\|]/g, "").trim();
}

async function handleSubmit() {
  const clean = sanitize(email.value);
  email.value = clean;
  if (!clean) {
    setError(currentLang.value.err_empty);
    return;
  }
  if (!emailRegex.test(clean)) {
    setError(currentLang.value.err_invalid);
    return;
  }

  loading.value = true;
  await new Promise((r) => setTimeout(r, 800));
  loading.value = false;
  success.value = true;

  // redirect หลัง 3 วินาที
  setTimeout(() => {
    const tenant = import.meta.env.VITE_TENANT_ID;
    window.location.href = `https://passwordreset.microsoftonline.com/?username=${encodeURIComponent(clean + emailDomain)}&tenantId=${tenant}`;
  }, 3000);
}
</script>

<template>
  <!-- ── Success modal ── -->
  <Transition name="modal-fade">
    <div
      v-if="success"
      class="modal-overlay"
      @click.self="router.push('/login')"
    >
      <div class="modal-box">
        <div class="modal-icon">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 class="modal-title">{{ currentLang.success_title }}</h3>
        <p class="modal-msg">{{ currentLang.success_msg }}</p>
        <p class="modal-msg" style="opacity: 0.6; font-size: 12px">
          กำลังพาไปยัง Microsoft ใน 3 วินาที...
        </p>
        <p class="modal-email">{{ email }}{{ emailDomain }}</p>
        <button class="modal-back-btn" @click="router.push('/login')">
          {{ currentLang.back }}
        </button>
      </div>
    </div>
  </Transition>

  <!-- ── Page ── -->
  <div class="fp-root">
    <!-- Ambient background (same as Login) -->
    <div class="bg-wrap" aria-hidden="true">
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />
      <div class="noise" />
      <div class="grid-lines" />
    </div>

    <!-- Language picker -->
    <div class="lang-picker">
      <button
        class="lang-btn"
        @click="showLangMenu = !showLangMenu"
        :aria-expanded="showLangMenu"
      >
        <span>{{ currentLang.flag }}</span>
        <span class="lang-label">{{ currentLang.label }}</span>
        <svg
          :class="['chevron', { open: showLangMenu }]"
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <Transition name="menu">
        <div v-if="showLangMenu" class="lang-menu">
          <button
            v-for="l in langs"
            :key="l.code"
            class="lang-item"
            :class="{ active: lang === l.code }"
            @click="
              lang = l.code;
              showLangMenu = false;
            "
          >
            <span>{{ l.flag }}</span>
            <span>{{ l.label }}</span>
            <svg
              v-if="lang === l.code"
              style="margin-left: auto; flex-shrink: 0"
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M2.5 7L5.5 10L11.5 4"
                stroke="var(--accent)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Card -->
    <div class="card-wrap">
      <div class="ring-border" aria-hidden="true" />

      <div class="fp-card">
        <!-- Card header: logo + back button -->
        <div class="card-header">
          <img :src="LoginLogo" alt="Smart RFQ" class="logo-img" />
          <button class="back-btn" @click="router.push('/login')">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {{ currentLang.back }}
          </button>
        </div>

        <!-- Title -->
        <div class="title-block">
          <div class="title-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          </div>
          <h2 class="fp-title">{{ currentLang.title }}</h2>
          <p class="fp-subtitle">{{ currentLang.subtitle }}</p>
        </div>

        <!-- Email field -->
        <div class="field">
          <label class="field-label">Email</label>
          <div class="input-wrap">
            <div class="input-icon">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              >
                <path
                  d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"
                />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <input
              v-model="email"
              type="text"
              class="inp"
              :placeholder="currentLang.placeholder"
              maxlength="50"
              @keyup.enter="handleSubmit"
              @input="email = email.replace(/[^a-zA-Z0-9._-]/g, '')"
              autocomplete="email"
            />
            <span class="domain-tag">{{ emailDomain }}</span>
          </div>
        </div>

        <!-- Error -->
        <Transition name="err-slide">
          <div v-if="error" class="err-box" role="alert">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              style="flex-shrink: 0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ error }}</span>
            <div class="err-progress" />
          </div>
        </Transition>

        <!-- Submit button -->
        <button class="submit-btn" :disabled="loading" @click="handleSubmit">
          <span class="btn-inner">
            <span v-if="!loading" class="btn-text">{{ currentLang.btn }}</span>
            <span v-else class="spinner" />
          </span>
        </button>
      </div>
    </div>

    <!-- Bottom watermark -->
    <p class="watermark">Smart RFQ · Powered by ITG</p>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");

/* ══════════════════════════════════════
   ROOT
══════════════════════════════════════ */
.fp-root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base, #060c18);
  color: var(--text-primary, #fff);
  font-family: "DM Sans", sans-serif;
  position: relative;
  overflow: hidden;
}

/* ══════════════════════════════════════
   BACKGROUND  (identical to Login)
══════════════════════════════════════ */
.bg-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  animation: orbFloat ease-in-out infinite alternate;
}
.orb-1 {
  width: 65vw;
  height: 65vw;
  background: var(--orb-1, #0d2d8a);
  opacity: 0.45;
  top: -20%;
  left: -15%;
  animation-duration: 20s;
}
.orb-2 {
  width: 45vw;
  height: 45vw;
  background: var(--orb-2, #0a4fa8);
  opacity: 0.35;
  bottom: -15%;
  right: -10%;
  animation-duration: 16s;
  animation-delay: -7s;
}
.orb-3 {
  width: 30vw;
  height: 30vw;
  background: var(--orb-3, #1a7ddc);
  opacity: 0.2;
  top: 45%;
  left: 55%;
  animation-duration: 22s;
  animation-delay: -11s;
}
@keyframes orbFloat {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(35px, 25px) scale(1.08);
  }
}
.noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.6;
}
.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(
      var(--accent-dim, rgba(56, 163, 245, 0.05)) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      var(--accent-dim, rgba(56, 163, 245, 0.05)) 1px,
      transparent 1px
    );
  background-size: 56px 56px;
  mask-image: radial-gradient(
    ellipse 70% 70% at 50% 50%,
    black 30%,
    transparent 80%
  );
}

/* ══════════════════════════════════════
   LANGUAGE PICKER
══════════════════════════════════════ */
.lang-picker {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 200;
}
.lang-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--bg-surface, rgba(255, 255, 255, 0.07));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--text-secondary, rgba(255, 255, 255, 0.8));
  padding: 8px 13px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(16px);
  transition:
    background 0.2s,
    border-color 0.2s;
  font-family: "DM Sans", sans-serif;
}
.lang-btn:hover {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.11));
  border-color: var(--border-accent, rgba(255, 255, 255, 0.2));
}
.lang-label {
  font-weight: 500;
}
.chevron {
  opacity: 0.5;
  transition: transform 0.2s;
}
.chevron.open {
  transform: rotate(180deg);
}
.lang-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-elevated, #fff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 14px;
  overflow: hidden;
  min-width: 164px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(20px);
}
.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
.lang-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  background: none;
  border: none;
  color: var(--text-secondary, #374151);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: "DM Sans", sans-serif;
}
.lang-item:hover {
  background: var(--accent-dim, rgba(56, 163, 245, 0.08));
}
.lang-item.active {
  background: var(--accent-dim, rgba(56, 163, 245, 0.12));
  color: var(--accent, #1a3d9e);
  font-weight: 500;
}

/* ══════════════════════════════════════
   CARD WRAPPER + RING
══════════════════════════════════════ */
.card-wrap {
  position: relative;
  z-index: 10;
  animation: cardIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Same ring as Login — accent-colored */
.ring-border {
  position: absolute;
  inset: -1.5px;
  border-radius: 26px;
  padding: 1.5px;
  background: conic-gradient(
    from var(--ring-angle, 0deg),
    transparent 0deg,
    var(--accent, #38a3f5) 80deg,
    var(--orb-3, #60c4ff) 160deg,
    transparent 240deg
  );

  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: spinRing 5s linear infinite;
  opacity: 0.7;
  z-index: -1;
}
@property --ring-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
@keyframes spinRing {
  to {
    --ring-angle: 360deg;
  }
}

/* ══════════════════════════════════════
   CARD  (matches Login card style)
══════════════════════════════════════ */
.fp-card {
  position: relative;
  width: 440px;
  border-radius: 24px;
  padding: 32px 40px 36px;
  overflow: hidden;
  background: color-mix(
    in srgb,
    var(--bg-base, #060c18) 82%,
    var(--orb-1, #1a3d9e) 18%
  );
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  box-shadow:
    0 0 0 1px var(--border-subtle, rgba(255, 255, 255, 0.06)),
    0 32px 64px rgba(0, 0, 0, 0.4),
    0 8px 24px rgba(0, 0, 0, 0.2);
}
.fp-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 60% 40% at 20% 0%,
    var(--accent-dim, rgba(56, 163, 245, 0.06)) 0%,
    transparent 70%
  );
  pointer-events: none;
}

[data-theme="light"] .fp-card {
  background: color-mix(in srgb, #ffffff 92%, var(--orb-1, #bfdbfe) 8%);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 24px 48px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.06);
}

/* ── Card header ── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}
.logo-img {
  height: 72px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 10px var(--accent-glow, rgba(56, 163, 245, 0.2)));
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  padding: 7px 13px;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}
.back-btn:hover {
  background: var(--accent-dim, rgba(56, 163, 245, 0.12));
  border-color: var(--border-accent, rgba(56, 163, 245, 0.3));
  color: var(--accent, #38a3f5);
}
[data-theme="light"] .back-btn {
  background: #f5f7fc;
  border-color: rgba(0, 0, 0, 0.1);
  color: var(--accent, #1a3d9e);
}
[data-theme="light"] .back-btn:hover {
  background: var(--accent-dim);
  border-color: var(--border-accent);
}

/* ── Title block ── */
.title-block {
  margin-bottom: 24px;
}
.title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent-dim, rgba(56, 163, 245, 0.12));
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.2));
  color: var(--accent, #38a3f5);
  margin-bottom: 14px;
}
.fp-title {
  font-family: "Sora", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}
.fp-subtitle {
  font-size: 13px;
  color: var(--text-muted, rgba(255, 255, 255, 0.45));
  line-height: 1.6;
  margin: 0;
}

/* ── Field ── */
.field {
  margin-bottom: 14px;
}
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, rgba(255, 255, 255, 0.45));
  margin-bottom: 6px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.input-wrap {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: 11px;
  overflow: hidden;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}
.input-wrap:focus-within {
  border-color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 3px var(--accent-dim, rgba(56, 163, 245, 0.15));
  background: rgba(255, 255, 255, 0.09);
}
[data-theme="light"] .input-wrap {
  background: #f5f7fc;
  border-color: rgba(0, 0, 0, 0.1);
}
[data-theme="light"] .input-wrap:focus-within {
  background: #fff;
}

.input-icon {
  display: flex;
  align-items: center;
  padding: 0 0 0 13px;
  color: var(--text-muted, rgba(255, 255, 255, 0.35));
  flex-shrink: 0;
}
.input-wrap:focus-within .input-icon {
  color: var(--accent, #38a3f5);
}

.inp {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  padding: 12px 10px;
  min-width: 0;
}
.inp::placeholder {
  color: var(--text-muted, rgba(255, 255, 255, 0.3));
}
[data-theme="light"] .inp {
  color: #08174a;
}
[data-theme="light"] .inp::placeholder {
  color: #bcc3d6;
}

.domain-tag {
  padding: 0 13px 0 2px;
  font-size: 12.5px;
  color: var(--accent, #38a3f5);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Error ── */
.err-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  padding: 9px 12px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}
[data-theme="light"] .err-box {
  background: #fef2f2;
  border-color: #fecaca;
}
.err-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, #ef4444, #f87171);
  animation: errCountdown 5s linear forwards;
}
@keyframes errCountdown {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
.err-slide-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.err-slide-leave-active {
  transition: all 0.2s ease;
}
.err-slide-enter-from,
.err-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}

/* ── Submit button ── */
.submit-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 11px;
  cursor: pointer;
  margin-top: 4px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent, #1a3d9e) 80%, black),
    var(--accent, #1a3d9e) 50%,
    color-mix(in srgb, var(--accent, #38a3f5) 80%, white)
  );
  color: #fff;
  font-family: "Sora", sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.15s,
    box-shadow 0.2s,
    opacity 0.2s;
  box-shadow: 0 6px 20px var(--accent-glow, rgba(56, 163, 245, 0.3));
}
.submit-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    transparent 55%
  );
  opacity: 0;
  transition: opacity 0.2s;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px var(--accent-glow, rgba(56, 163, 245, 0.4));
}
.submit-btn:hover:not(:disabled)::after {
  opacity: 1;
}
.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ══════════════════════════════════════
   SUCCESS MODAL
══════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  background: color-mix(
    in srgb,
    var(--bg-base, #060c18) 82%,
    var(--orb-1, #1a3d9e) 18%
  );
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  border-radius: 22px;
  padding: 40px 44px;
  width: 360px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.35),
    0 0 0 1px var(--border-accent, rgba(56, 163, 245, 0.2));
  animation: modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
[data-theme="light"] .modal-box {
  background: color-mix(in srgb, #ffffff 92%, var(--orb-1, #bfdbfe) 8%);
  border-color: var(--border-subtle, rgba(0, 0, 0, 0.08));
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px var(--border-accent, rgba(26, 61, 158, 0.2));
}
@keyframes modalPop {
  from {
    transform: scale(0.88);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-icon {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: var(--accent-dim, rgba(56, 163, 245, 0.12));
  border: 1.5px solid var(--border-accent, rgba(56, 163, 245, 0.25));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #38a3f5);
  margin-bottom: 4px;
  animation: successPop 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}
@keyframes successPop {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-title {
  font-family: "Sora", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0;
}
.modal-msg {
  font-size: 13px;
  color: var(--text-muted, rgba(255, 255, 255, 0.5));
  line-height: 1.6;
  margin: 0;
}
.modal-email {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent, #38a3f5);
  background: var(--accent-dim, rgba(56, 163, 245, 0.1));
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.2));
  padding: 6px 16px;
  border-radius: 8px;
  margin: 4px 0;
}
.modal-back-btn {
  margin-top: 6px;
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent, #1a3d9e) 80%, black),
    var(--accent, #1a3d9e) 50%,
    color-mix(in srgb, var(--accent, #38a3f5) 80%, white)
  );
  color: #fff;
  font-family: "Sora", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.15s;
  box-shadow: 0 4px 16px var(--accent-glow, rgba(56, 163, 245, 0.25));
}
.modal-back-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.modal-fade-enter-active {
  transition: opacity 0.25s ease;
}
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ══════════════════════════════════════
   WATERMARK
══════════════════════════════════════ */
.watermark {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
  letter-spacing: 0.07em;
  pointer-events: none;
  z-index: 5;
}
</style>
