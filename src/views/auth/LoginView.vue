<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../stores/auth.js";
import { loginWithMicrosoft } from "../../auth/AuthenWithMicrosoft.js";

const router = useRouter();
const auth = useAuthStore();

const LoginLogo =
  "https://res.cloudinary.com/dxoiu2cn5/image/upload/v1780472550/image0-removebg-preview_vcjesh.png";
const email = ref("");
const emailDomain = "@tjg.co.th";
const password = ref("");
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
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
    placeholder_email: "ชื่อผู้ใช้",
    placeholder_pass: "รหัสผ่าน",
    login_text: "เข้าสู่ระบบ",
    keep: "จดจำฉันไว้",
    forgot: "ลืมรหัสผ่าน?",
    or: "หรือ",
    ms: "เข้าสู่ระบบด้วย Microsoft",
    err_empty: "กรุณากรอก Email และ Password",
    err_wrong: "Email หรือ Password ไม่ถูกต้อง",
  },
  {
    code: "en",
    flag: "🇬🇧",
    label: "English",
    placeholder_email: "username",
    placeholder_pass: "••••••••",
    login_text: "Login",
    keep: "Keep me logged in",
    forgot: "Forgot password?",
    or: "or",
    ms: "Sign in with Microsoft",
    err_empty: "Please enter Email and Password",
    err_wrong: "Invalid Email or Password",
  },
  {
    code: "ja",
    flag: "🇯🇵",
    label: "日本語",
    placeholder_email: "ユーザー名",
    placeholder_pass: "パスワード",
    login_text: "ログイン",
    keep: "ログイン状態を保持",
    forgot: "パスワードを忘れた？",
    or: "または",
    ms: "Microsoftでサインイン",
    err_empty: "メールとパスワードを入力してください",
    err_wrong: "メールまたはパスワードが正しくありません",
  },
];
const showLangMenu = ref(false);
const currentLang = computed(
  () => langs.find((l) => l.code === lang.value) || langs[1],
);

function setError(msg) {
  error.value = msg;
  clearTimeout(errorTimer);
  errorTimer = setTimeout(() => {
    error.value = "";
  }, 5000);
}

const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,48}[a-zA-Z0-9]$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*\-_+=?]{4,6}$/;

function sanitize(str) {
  return str
    .replace(/[<>'"`;\\]/g, "")
    .replace(/(-{2}|\/\*|\*\/)/g, "")
    .trim();
}

function validateEmail(val) {
  if (!val) return currentLang.value.err_empty;
  if (val.length > 50) return "Email ยาวเกินไป (สูงสุด 50 ตัว)";
  if (/\s/.test(val)) return "ไม่อนุญาตให้เว้นวรรค";
  if (/[ก-๙\u0E00-\u0E7F]/.test(val))
    return "ไม่รองรับภาษาไทย / Thai not allowed";
  if (/[<>'"`;\\\/\(\)\[\]\{\}\|]/.test(val)) return "มีอักขระที่ไม่อนุญาต";
  if (!emailRegex.test(val)) return "ใช้ได้เฉพาะ a-z, A-Z, 0-9, . _ -";
  if (val.startsWith(".") || val.startsWith("-") || val.startsWith("_"))
    return "Email ต้องเริ่มด้วยตัวอักษรหรือตัวเลข";
  if (val.endsWith(".") || val.endsWith("-") || val.endsWith("_"))
    return "Email ต้องจบด้วยตัวอักษรหรือตัวเลข";
  if (/[._-]{2,}/.test(val)) return "ไม่อนุญาตให้ใช้ . _ - ติดกัน 2 ตัว";
  return null;
}

function validatePassword(val) {
  if (!val) return currentLang.value.err_empty;
  if (/\s/.test(val)) return "Password ไม่อนุญาตให้เว้นช่องว่าง";
  if (val.length < 4) return "Password ต้องมีอย่างน้อย 4 ตัว";
  if (val.length > 6) return "Password ต้องไม่เกิน 6 ตัว";
  if (!/[a-z]/.test(val)) return "Password ต้องมีตัวเล็ก a-z อย่างน้อย 1 ตัว";
  if (!/[A-Z]/.test(val)) return "Password ต้องมีตัวใหญ่ A-Z อย่างน้อย 1 ตัว";
  if (!/\d/.test(val)) return "Password ต้องมีตัวเลข 0-9 อย่างน้อย 1 ตัว";
  if (!passwordRegex.test(val)) return "Password มีอักขระที่ไม่อนุญาต";
  return null;
}

async function handleLogin() {
  const cleanEmail = sanitize(email.value);
  const cleanPassword = sanitize(password.value);
  email.value = cleanEmail;
  password.value = cleanPassword;

  const emailErr = validateEmail(cleanEmail);
  if (emailErr) { setError(emailErr); return; }

  const passErr = validatePassword(cleanPassword);
  if (passErr) { setError(passErr); return; }

  loading.value = true;
  error.value = "";
  
  try {
    
    const BASE = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL_BACKEND}`;
    const payload = { email: cleanEmail + emailDomain, password: cleanPassword };
    
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.message || currentLang.value.err_wrong);
      return;
    }

    const data = await res.json();
  
    auth.setAuth(data.token ?? "cookie-based", data.role, {
      email: data.email,
      name: data.fullName,
    });
    router.push("/doc-request");

  } catch (err) {
    setError(currentLang.value.err_wrong);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-root">
    <!-- ── Ambient background ── -->
    <div class="bg-wrap" aria-hidden="true">
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />
      <div class="noise" />
      <div class="grid-lines" />
    </div>

    <!-- ── Language picker ── -->
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

    <!-- ── Card ── -->
    <div class="card-wrap">
      <!-- Animated ring border -->
      <div class="ring-border" aria-hidden="true" />

      <div class="login-card">
        <!-- Logo -->
        <div class="logo-wrap">
          <img :src="LoginLogo" alt="Smart RFQ" class="logo-img" />
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
              :placeholder="currentLang.placeholder_email"
              @keyup.enter="handleLogin"
              autocomplete="username"
            />
            <span class="domain-tag">{{ emailDomain }}</span>
          </div>
        </div>

        <!-- Password field -->
        <div class="field">
          <label class="field-label">Password</label>
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
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="inp"
              :placeholder="currentLang.placeholder_pass"
              @keyup.enter="handleLogin"
              autocomplete="current-password"
            />
            <button
              class="eye-btn"
              @click="showPassword = !showPassword"
              tabindex="-1"
              type="button"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg
                v-if="!showPassword"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
                />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember / Forgot -->
        <div class="row-options">
          <label class="remember-label" @click="rememberMe = !rememberMe">
            <span class="custom-check" :class="{ checked: rememberMe }">
              <svg
                v-if="rememberMe"
                width="9"
                height="9"
                viewBox="0 0 10 10"
                fill="none"
              >
                <path
                  d="M1.5 5L4 7.5L8.5 2.5"
                  stroke="white"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span>{{ currentLang.keep }}</span>
          </label>
          <a
            href="#"
            class="forgot-link"
            @click.prevent="router.push('/forgot-password')"
            >{{ currentLang.forgot }}</a
          >
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

        <!-- Login button -->
        <button class="login-btn" :disabled="loading" @click="handleLogin">
          <span class="btn-inner">
            <span v-if="!loading" class="btn-text">{{
              currentLang.login_text
            }}</span>
            <span v-else class="spinner" />
          </span>
        </button>

        <!-- Divider -->
        <div class="divider">
          <span class="div-line" />
          <span class="div-text">{{ currentLang.or }}</span>
          <span class="div-line" />
        </div>

        <!-- Microsoft SSO -->
        <button class="ms-btn" @click="loginWithMicrosoft">
          <svg width="17" height="17" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
          <span>{{ currentLang.ms }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");

/* ══════════════════════════════════════
   ROOT
══════════════════════════════════════ */
.login-root {
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
   BACKGROUND
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

/* Noise texture overlay */
.noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.6;
}

/* Subtle grid */
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

/* Single clean animated ring that uses theme accent */
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
   LOGIN CARD
══════════════════════════════════════ */
.login-card {
  position: relative;
  width: 440px;
  border-radius: 24px;
  padding: 36px 40px 32px;
  overflow: hidden;
  /* Dark mode: glass panel with theme-tinted dark base */
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

/* Light mode: white-ish glass with slight tint */
[data-theme="light"] .login-card {
  background: color-mix(in srgb, #ffffff 92%, var(--orb-1, #bfdbfe) 8%);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 24px 48px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.06);
}

/* Top-left accent shimmer — uses theme accent, very subtle */
.login-card::before {
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

/* ── Logo ── */
.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.logo-img {
  height: 160px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 16px var(--accent-glow, rgba(56, 163, 245, 0.2)));
  animation: logoFloat 5s ease-in-out infinite alternate;
}
@keyframes logoFloat {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-5px);
  }
}

/* ── Headline ── */
.headline {
  text-align: center;
  margin-bottom: 24px;
}
.headline-title {
  font-family: "Sora", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #08174a);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.headline-sub {
  font-size: 13px;
  color: var(--text-muted, #8892a4);
  margin: 0;
}

/* ── Fields ── */
.field {
  margin-bottom: 14px;
}
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #7a82a0);
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
    box-shadow 0.2s;
}
.input-wrap:focus-within {
  border-color: var(--accent, #38a3f5);
  box-shadow: 0 0 0 3px var(--accent-dim, rgba(56, 163, 245, 0.12));
  background: var(--bg-elevated, #fff);
}

.input-icon {
  display: flex;
  align-items: center;
  padding: 0 0 0 13px;
  color: var(--text-muted, #b0b8cc);
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
  color: var(--text-primary, #08174a);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  padding: 12px 10px;
  min-width: 0;
}
.inp::placeholder {
  color: var(--text-muted, #bcc3d6);
}

.domain-tag {
  padding: 0 13px 0 2px;
  font-size: 12.5px;
  color: var(--accent, #1a7ddc);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #b0b8cc);
  padding: 0 12px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  flex-shrink: 0;
}
.eye-btn:hover {
  color: var(--accent, #1a3d9e);
}

/* ── Remember / Forgot ── */
.row-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.custom-check {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1.5px solid var(--border-subtle, #d4d8ea);
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background 0.18s,
    border-color 0.18s;
}
.custom-check.checked {
  background: var(--accent, #1a7ddc);
  border-color: var(--accent, #1a7ddc);
}
.remember-label span:last-child {
  font-size: 13px;
  color: var(--text-secondary, #6b7196);
}

.forgot-link {
  font-size: 13px;
  color: var(--accent, #1a7ddc);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}
.forgot-link:hover {
  opacity: 0.75;
}

/* ── Error ── */
.err-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 9px 12px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
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

/* ── Login button ── */
.login-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 11px;
  cursor: pointer;
  margin-bottom: 16px;
  background: var(--accent, #1a3d9e);
  /* Layer a subtle lighter gradient over the accent color */
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
    opacity 0.2s,
    box-shadow 0.2s;
  box-shadow: 0 6px 20px var(--accent-glow, rgba(56, 163, 245, 0.3));
}
.login-btn::after {
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
.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px var(--accent-glow, rgba(56, 163, 245, 0.4));
}
.login-btn:hover:not(:disabled)::after {
  opacity: 1;
}
.login-btn:active:not(:disabled) {
  transform: translateY(0);
}
.login-btn:disabled {
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

/* ── Divider ── */
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.div-line {
  flex: 1;
  height: 1px;
  background: var(--border-subtle, #e4e8f2);
}
.div-text {
  font-size: 12px;
  color: var(--text-muted, #b0b8cc);
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

/* ── Microsoft button ── */
.ms-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 11px;
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: 11px;
  color: var(--text-secondary, #3c4157);
  font-family: "DM Sans", sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}
.ms-btn:hover {
  background: var(--accent-dim, rgba(56, 163, 245, 0.07));
  border-color: var(--border-accent, rgba(56, 163, 245, 0.25));
  color: var(--accent, #0d2160);
}

/* ── Watermark ── */
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

/* ── Light mode card internals ── */
[data-theme="light"] .login-card {
  background: color-mix(in srgb, #ffffff 92%, var(--orb-1, #bfdbfe) 8%);
}
[data-theme="light"] .input-wrap {
  background: #f5f7fc;
  border-color: rgba(0, 0, 0, 0.1);
}
[data-theme="light"] .input-wrap:focus-within {
  background: #ffffff;
}
[data-theme="light"] .ms-btn {
  background: #f5f7fc;
  border-color: rgba(0, 0, 0, 0.1);
}
[data-theme="light"] .ms-btn:hover {
  background: var(--accent-dim);
  color: var(--accent);
}
[data-theme="light"] .custom-check {
  background: #3d7aff;
  border-color: #d4d8ea;
}
[data-theme="light"] .headline-title {
  color: #08174a;
}
[data-theme="light"] .headline-sub {
  color: #8892a4;
}
[data-theme="light"] .field-label {
  color: #7a82a0;
}
[data-theme="light"] .inp {
  color: #08174a;
}
[data-theme="light"] .inp::placeholder {
  color: #bcc3d6;
}
</style>
