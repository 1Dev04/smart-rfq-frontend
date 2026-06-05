
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()

const LoginLogo = 'https://res.cloudinary.com/dxoiu2cn5/image/upload/v1780472550/image0-removebg-preview_vcjesh.png'

const email = ref('')
const emailDomain = '@itg.co.th'
const loading = ref(false)
const success = ref(false)
const error = ref('')
let errorTimer = null

const { locale } = useI18n()
const lang = computed({
  get: () => locale.value,
  set: (value) => {
    locale.value = value
    localStorage.setItem('lang', value)
    document.documentElement.lang = value
  },
})
const langs = [
  { code: 'th', flag: '🇹🇭', label: 'ภาษาไทย', title: 'ลืมรหัสผ่าน?', subtitle: 'กรอก Email ที่ลงทะเบียนไว้เพื่อรับลิงก์รีเซ็ตรหัสผ่าน', btn: 'ส่งลิงก์รีเซ็ต', back: 'กลับไปหน้าเข้าสู่ระบบ', placeholder: 'ชื่อผู้ใช้', success_title: 'ส่งลิงก์แล้ว!', success_msg: 'กรุณาตรวจสอบ Email ของคุณ', err_empty: 'กรุณากรอก Email', err_invalid: 'รูปแบบ Email ไม่ถูกต้อง' },
  { code: 'en', flag: '🇬🇧', label: 'English',  title: 'Forgot Password?', subtitle: 'Enter your registered email address to receive a password reset link.', btn: 'Send Reset Link', back: 'Back to Login', placeholder: 'username', success_title: 'Link Sent!', success_msg: 'Please check your email inbox.', err_empty: 'Please enter your Email', err_invalid: 'Invalid email format' },
  { code: 'ja', flag: '🇯🇵', label: '日本語',    title: 'パスワードを忘れた？', subtitle: 'パスワードリセットリンクを受け取るには登録済みのメールアドレスを入力してください。', btn: 'リセットリンクを送信', back: 'サインインに戻る', placeholder: 'ユーザー名', success_title: '送信しました！', success_msg: 'メールボックスを確認してください。', err_empty: 'メールを入力してください', err_invalid: 'メール形式が正しくありません' },
]
const showLangMenu = ref(false)
const currentLang = computed(() => langs.find(l => l.code === lang.value) || langs[1])

const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,48}[a-zA-Z0-9]$/

function setError(msg) {
  error.value = msg
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => { error.value = '' }, 5000)
}

function sanitize(str) {
  return str.replace(/[<>'"`;\\\/\(\)\[\]\{\}\|]/g, '').trim()
}

async function handleSubmit() {
  const clean = sanitize(email.value)
  email.value = clean
  if (!clean) { setError(currentLang.value.err_empty); return }
  if (!emailRegex.test(clean)) { setError(currentLang.value.err_invalid); return }

  loading.value = true; error.value = ''
  try {
    await new Promise(r => setTimeout(r, 1500))

    success.value = true
  } catch { setError('Something went wrong. Please try again.') }
  finally { loading.value = false }
}
</script>

<template>
  <Transition name="modal-fade">
  <div v-if="success" class="modal-overlay" @click.self="router.push('/login')">
    <div class="modal-box">
      <div class="success-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h3 class="modal-title">{{ currentLang.success_title }}</h3>
      <p class="modal-msg">{{ currentLang.success_msg }}</p>
      <p class="modal-email">{{ email }}{{ emailDomain }}</p>
      <button class="reset-btn" @click="router.push('/login')">
        {{ currentLang.back }}
      </button>
    </div>
  </div>
</Transition>
  <div class="fp-root">
    
    <div class="bg-wrap">
      <div class="orb orb-1" /><div class="orb orb-2" />
      <div class="orb orb-3" /><div class="orb orb-4" />
      <div class="grid" />
    </div>


    <div class="lang-picker">
      <button class="lang-btn" @click="showLangMenu = !showLangMenu">
        <span>{{ currentLang.flag }}</span>
        <span>{{ currentLang.label }}</span>
        <svg :class="['chevron', { open: showLangMenu }]" width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <Transition name="menu">
        <div v-if="showLangMenu" class="lang-menu">
          <button v-for="l in langs" :key="l.code" class="lang-item" :class="{ active: lang === l.code }"
            @click="lang = l.code; showLangMenu = false">
            <span>{{ l.flag }}</span><span>{{ l.label }}</span>
            <svg v-if="lang === l.code" style="margin-left:auto" width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="#1a3d9e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </Transition>
    </div>

    
    <div class="card-wrap">
      <div class="card-border-glow" />
      <div class="card-border-glow-2" />
      <div class="particle p1" /><div class="particle p2" />
      <div class="particle p3" /><div class="particle p4" />

      <div class="fp-card">
        <div class="card-shimmer" />

     
        <div class="card-header">
          <div class="logo-row">
            <img :src="LoginLogo" alt="Smart RFQ" class="logo-img" />
          </div>
          <button class="back-btn" @click="router.push('/login')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {{ currentLang.back }}
          </button>
        </div>

  
        <div class="form-section">
            <div class="title-section">
              <h2 class="fp-title">{{ currentLang.title }}</h2>
              <p class="fp-subtitle">{{ currentLang.subtitle }}</p>
            </div>

            <div class="field">
              <label class="field-label">Email</label>
              <div class="input-row">
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
                <span class="domain">{{ emailDomain }}</span>
              </div>
            </div>

          
            <Transition name="err-slide">
              <div v-if="error" class="err">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{{ error }}</span>
                <div class="err-bar" />
              </div>
            </Transition>

            <button class="submit-btn" :disabled="loading" @click="handleSubmit">
              <span class="btn-bg" /><span class="btn-shine" />
              <span class="btn-content">
                <span v-if="!loading">{{ currentLang.btn }}</span>
                <span v-else class="spin" />
              </span>
            </button>
          </div>

      </div>
    </div>
  </div>

  
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap');

.fp-root {
  min-height: 100vh; width: 100%;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg, #050a18); color: var(--text, #e8f6ff); font-family: 'DM Sans', sans-serif;
  position: relative; overflow: hidden;
}

.bg-wrap { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(100px); animation: orbDrift ease-in-out infinite alternate; }
.orb-1 { width: 700px; height: 700px; background: var(--orb-1, #0d2d8a); opacity: 0.5; top: -200px; left: -200px; animation-duration: 18s; }
.orb-2 { width: 500px; height: 500px; background: var(--orb-2, #0a4fa8); opacity: 0.4; bottom: -150px; right: -100px; animation-duration: 14s; animation-delay: -6s; }
.orb-3 { width: 350px; height: 350px; background: var(--orb-3, #1a7ddc); opacity: 0.2; top: 40%; left: 60%; animation-duration: 20s; animation-delay: -10s; }
.orb-4 { width: 250px; height: 250px; background: var(--accent, #38a3f5); opacity: 0.12; top: 20%; left: 30%; animation-duration: 12s; animation-delay: -4s; }
@keyframes orbDrift { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
.grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(56,163,245,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56,163,245,0.05) 1px, transparent 1px);
  background-size: 52px 52px;
}


.lang-picker { position: fixed; top: 20px; right: 20px; z-index: 200; }
.lang-btn {
  display: flex; align-items: center; gap: 7px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.9); padding: 8px 14px; border-radius: 10px;
  font-size: 13px; cursor: pointer; backdrop-filter: blur(16px);
  transition: background 0.2s; font-family: 'DM Sans', sans-serif;
}
.lang-btn:hover { background: rgba(255,255,255,0.13); }
.chevron { transition: transform 0.2s; opacity: 0.6; }
.chevron.open { transform: rotate(180deg); }
.lang-menu {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: rgba(255,255,255,0.97); border: 1px solid #e5e7eb;
  border-radius: 14px; overflow: hidden; min-width: 160px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.15);
}
.menu-enter-active, .menu-leave-active { transition: opacity 0.15s, transform 0.15s; }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-6px); }
.lang-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 11px 16px; background: none; border: none;
  color: #374151; font-size: 13px; cursor: pointer;
  transition: background 0.15s; font-family: 'DM Sans', sans-serif;
}
.lang-item:hover { background: #f0f6ff; }
.lang-item.active { background: #eaf0fb; color: #1a3d9e; font-weight: 500; }


.card-wrap { position: relative; z-index: 10; animation: cardIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
@keyframes cardIn { from { opacity: 0; transform: translateY(28px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

.card-border-glow {
  position: absolute; inset: -2px; border-radius: 26px;
  background: conic-gradient(from var(--angle, 0deg), transparent 0deg, #1a3d9e 60deg, #38a3f5 120deg, #93d0fb 180deg, #38a3f5 240deg, #1a3d9e 300deg, transparent 360deg);
  animation: spinBorder 4s linear infinite; z-index: -1;
}
.card-border-glow-2 {
  position: absolute; inset: -2px; border-radius: 26px;
  background: conic-gradient(from calc(var(--angle, 0deg) + 180deg), transparent 0deg, #0c4a8f 60deg, #1a7ddc 120deg, #38a3f5 180deg, transparent 300deg);
  animation: spinBorder 4s linear infinite reverse; opacity: 0.5; z-index: -1;
}
@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
@keyframes spinBorder { to { --angle: 360deg; } }


@keyframes orbitCard {
  0%   { offset-distance: 0%;   opacity: 0.3; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0.3; }
}


.fp-card {
  position: relative; width: 460px;
  background: #ffffff; border-radius: 24px;
  padding: 32px 44px 36px; overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.9);
}
.card-shimmer {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(135deg, rgba(56,163,245,0.04) 0%, transparent 50%, rgba(26,61,158,0.03) 100%);
  animation: shimmerPulse 6s ease-in-out infinite alternate;
}
@keyframes shimmerPulse { from { opacity: 0.5; } to { opacity: 1; } }


.card-header {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 24px;
}
.logo-row { display: flex; align-items: center; }
.logo-img {
  height: 82px; width: auto; object-fit: contain;
  display: flex; position: relative; margin-left: -15px;
  filter: drop-shadow(0 2px 8px rgba(26,61,158,0.15));
}
.back-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; padding: 0;
  color: #1a7ddc; font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: color 0.2s, gap 0.2s;
}
.back-btn:hover { color: #0d2160; gap: 8px; }


.title-section { margin-bottom: 24px; }
.fp-title {
  font-family: 'Sora', sans-serif; font-size: 20px;
  font-weight: 700; color: #08174a; margin-bottom: 6px;
  text-decoration: underline; text-underline-offset: 4px;
  text-decoration-color: rgba(26,61,158,0.3);
}
.fp-subtitle { font-size: 13px; color: #6b7196; line-height: 1.6; }


.field { margin-bottom: 16px; }
.field-label { display: block; font-size: 11px; font-weight: 600; color: #6b7196; margin-bottom: 7px; letter-spacing: 0.09em; text-transform: uppercase; }
.input-row {
  display: flex; align-items: center;
  background: #f8f9fc; border: 1.5px solid #e5e7f0;
  border-radius: 12px; overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-row:focus-within { border-color: #38a3f5; box-shadow: 0 0 0 3px rgba(56,163,245,0.12); background: #fff; }
.inp { flex: 1; background: none; border: none; outline: none; color: #08174a; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 12px 14px; }
.inp::placeholder { color: #b0b5cc; }
.domain { padding: 0 14px 0 2px; font-size: 13px; color: #1a7ddc; font-weight: 600; white-space: nowrap; }

.err {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #dc2626; margin-bottom: 12px;
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 10px; padding: 10px 12px;
  position: relative; overflow: hidden;
}
.err-bar {
  position: absolute; bottom: 0; left: 0; height: 3px;
  background: linear-gradient(90deg, #ef4444, #f87171);
  animation: errCountdown 5s linear forwards;
}
@keyframes errCountdown { from { width: 100%; } to { width: 0%; } }
.err-slide-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.err-slide-leave-active { transition: all 0.25s ease; }
.err-slide-enter-from, .err-slide-leave-to { opacity: 0; transform: translateY(-6px); max-height: 0; }
.err-slide-enter-to, .err-slide-leave-from { opacity: 1; transform: translateY(0); max-height: 60px; }


.submit-btn {
  width: 100%; height: 46px; border: none; border-radius: 12px;
  cursor: pointer; position: relative; overflow: hidden;
  transition: transform 0.15s, opacity 0.2s; margin-top: 4px;
  font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600;
  color: #fff; letter-spacing: 0.05em; background: transparent;
}
.btn-bg { position: absolute; inset: 0; border-radius: 12px; background: linear-gradient(135deg, #0d2160 0%, #1a3d9e 40%, #38a3f5 100%); }
.btn-shine { position: absolute; inset: 0; border-radius: 12px; background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 55%); opacity: 0; transition: opacity 0.2s; }
.btn-content { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; }
.submit-btn:hover:not(:disabled) .btn-shine { opacity: 1; }
.submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.spin { display: inline-block; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }


.success-box {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 16px 0 8px; gap: 12px;
}
.success-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #eafbee, #c9fecc);
  display: flex; align-items: center; justify-content: center;
  color: #1a9e25;
  box-shadow: 0 0 0 8px rgba(100, 245, 56, 0.08);
  animation: successPop 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes successPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.success-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: #08174a; }
.success-msg { font-size: 13px; color: #6b7196; }
.success-email { font-size: 13px; font-weight: 600; color: #1a3d9e; background: #eaf0fb; padding: 6px 14px; border-radius: 8px; }
.reset-btn {
  margin-top: 8px; width: 100%; height: 44px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #0d2160, #38a3f5);
  color: #fff; font-family: 'Sora', sans-serif; font-size: 14px;
  font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.15s;
}
.reset-btn:hover { opacity: 0.9; transform: translateY(-1px); }


.fade-up-enter-active { transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
.fade-up-leave-active { transition: all 0.2s ease; position: absolute; width: 100%; }
.fade-up-enter-from  { opacity: 0; transform: translateY(12px); }
.fade-up-leave-to    { opacity: 0; transform: translateY(-8px); }

.modal-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--bg-elevated, #ffffff); border-radius: 20px;
  padding: 40px 44px; width: 360px; max-width: 90vw;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 12px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.25), 0 0 0 2px rgba(56,163,245,0.3);
  animation: modalPop 0.4s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes modalPop {
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
.modal-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: #08174a; }
.modal-msg   { font-size: 13px; color: #6b7196; line-height: 1.6; }
.modal-email { font-size: 13px; font-weight: 600; color: #1a3d9e; background: #eaf0fb; padding: 6px 14px; border-radius: 8px; }

.modal-fade-enter-active { transition: opacity 0.25s ease; }
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
