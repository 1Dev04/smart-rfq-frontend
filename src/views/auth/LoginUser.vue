
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const LoginLogo = 'https://res.cloudinary.com/dxoiu2cn5/image/upload/v1780472550/image0-removebg-preview_vcjesh.png'
const email = ref('')
const emailDomain = '@tjg.co.th'
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
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
  { code: 'th', flag: '🇹🇭', label: 'ภาษาไทย', placeholder_email: 'ชื่อผู้ใช้', placeholder_pass: 'รหัสผ่าน', login_text: 'เข้าสู่ระบบ', keep: 'จดจำฉันไว้', forgot: 'ลืมรหัสผ่าน?', or: 'หรือ', ms: 'เข้าสู่ระบบด้วย Microsoft', err_empty: 'กรุณากรอก Email และ Password', err_wrong: 'Email หรือ Password ไม่ถูกต้อง' },
  { code: 'en', flag: '🇬🇧', label: 'English',  placeholder_email: 'username', placeholder_pass: '••••••••', login_text: 'Login', keep: 'Keep me logged in', forgot: 'Forgot password?', or: 'or', ms: 'Sign in with Microsoft', err_empty: 'Please enter Email and Password', err_wrong: 'Invalid Email or Password' },
  { code: 'ja', flag: '🇯🇵', label: '日本語',    placeholder_email: 'ユーザー名', placeholder_pass: 'パスワード', login_text: 'ログイン', keep: 'ログイン状態を保持', forgot: 'パスワードを忘れた？', or: 'または', ms: 'Microsoftでサインイン', err_empty: 'メールとパスワードを入力してください', err_wrong: 'メールまたはパスワードが正しくありません' },
]
const showLangMenu = ref(false)
const currentLang = computed(() => langs.find(l => l.code === lang.value) || langs[1])

function setError(msg) {
  error.value = msg
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => { error.value = '' }, 5000)
}



const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,48}[a-zA-Z0-9]$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*\-_+=?]{4,6}$/


function sanitize(str) {
  return str
    .replace(/[<>'"`;\\]/g, '')   
    .replace(/(-{2}|\/\*|\*\/)/g, '')  
    .trim()
}

function validateEmail(val) {
  if (!val) return currentLang.value.err_empty
  if (val.length > 50) return 'Email ยาวเกินไป (สูงสุด 50 ตัว)'
  if (/\s/.test(val)) return 'ไม่อนุญาตให้เว้นวรรค'
  if (/[ก-๙\u0E00-\u0E7F]/.test(val)) return 'ไม่รองรับภาษาไทย / Thai not allowed'
  if (/[<>'"`;\\\/\(\)\[\]\{\}\|]/.test(val)) return 'มีอักขระที่ไม่อนุญาต'
  if (!emailRegex.test(val)) return 'ใช้ได้เฉพาะ a-z, A-Z, 0-9, . _ -'
  if (val.startsWith('.') || val.startsWith('-') || val.startsWith('_')) return 'Email ต้องเริ่มด้วยตัวอักษรหรือตัวเลข'
  if (val.endsWith('.') || val.endsWith('-') || val.endsWith('_')) return 'Email ต้องจบด้วยตัวอักษรหรือตัวเลข'
  if (/[._-]{2,}/.test(val)) return 'ไม่อนุญาตให้ใช้ . _ - ติดกัน 2 ตัว'
  return null
}

function validatePassword(val) {
  if (!val) return currentLang.value.err_empty
  if (/\s/.test(val)) return 'Password ไม่อนุญาตให้เว้นช่องว่าง'
  if (val.length < 4) return 'Password ต้องมีอย่างน้อย 4 ตัว'
  if (val.length > 6) return 'Password ต้องไม่เกิน 6 ตัว'
  if (!/[a-z]/.test(val)) return 'Password ต้องมีตัวเล็ก a-z อย่างน้อย 1 ตัว'
  if (!/[A-Z]/.test(val)) return 'Password ต้องมีตัวใหญ่ A-Z อย่างน้อย 1 ตัว'
  if (!/\d/.test(val)) return 'Password ต้องมีตัวเลข 0-9 อย่างน้อย 1 ตัว'
  if (!passwordRegex.test(val)) return 'Password มีอักขระที่ไม่อนุญาต'
  return null
}

async function handleLogin() {

  const cleanEmail = sanitize(email.value)
  const cleanPassword = sanitize(password.value)


  email.value = cleanEmail
  password.value = cleanPassword

  
  const emailErr = validateEmail(cleanEmail)
  if (emailErr) { setError(emailErr); return }

  const passErr = validatePassword(cleanPassword)
  if (passErr) { setError(passErr); return }

  loading.value = true; error.value = ''
  try {
    await new Promise(r => setTimeout(r, 1400))
    auth.setAuth('mock-jwt-token', 'user', { email: cleanEmail + emailDomain })
    router.push('/doc-request-user')
  } catch { setError(currentLang.value.err_wrong) }
  finally { loading.value = false }
}

</script>

<template>
  <div class="login-root">
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

     
      <div class="particle p1" />
      <div class="particle p2" />
      <div class="particle p3" />
      <div class="particle p4" />

      <div class="login-card">
        <div class="card-shimmer" />

     
        <div class="logo-wrap">
          <img :src="LoginLogo" alt="Smart RFQ" class="logo-img" />
        </div>

    
        <div class="field">
          <label class="field-label">Email</label>
          <div class="input-row">
            <input v-model="email" type="text" class="inp" :placeholder="currentLang.placeholder_email" @keyup.enter="handleLogin" autocomplete="username"/>
            <span class="domain">{{ emailDomain }}</span>
          </div>
        </div>

        
        <div class="field">
          <label class="field-label">Password</label>
          <div class="input-row">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" class="inp" :placeholder="currentLang.placeholder_pass" @keyup.enter="handleLogin" autocomplete="current-password"/>
            <button class="eye" @click="showPassword = !showPassword" tabindex="-1" type="button">
              <svg v-if="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

      
        <div class="row-between">
          <label class="remember">
            <span class="custom-check" :class="{ checked: rememberMe }" @click="rememberMe = !rememberMe">
              <svg v-if="rememberMe" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span>{{ currentLang.keep }}</span>
          </label>
          <a href="#" class="forgot" @click.prevent="router.push('/forgot-password')">{{ currentLang.forgot }}</a>
        </div>

    
        <Transition name="err-slide">
          <div v-if="error" class="err">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ error }}</span>
            <div class="err-bar" />
          </div>
        </Transition>

        <button class="login-btn" :disabled="loading" @click="handleLogin">
          <span class="btn-bg" /><span class="btn-shine" />
          <span class="btn-content">
            <span v-if="!loading">{{ currentLang.login_text }}</span>
            <span v-else class="spin" />
          </span>
        </button>

        <div class="divider">
          <span class="div-line" /><span class="div-text">{{ currentLang.or }}</span><span class="div-line" />
        </div>

        <button class="ms-btn">
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
            <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
            <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          {{ currentLang.ms }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap');

.login-root {
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
  0%   { offset-distance: 0%; opacity: 0.3; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0.3; }
}

.login-card {
  position: relative; width: 460px;
  background: var(--bg-elevated, #ffffff); border-radius: 24px;
  padding: 38px 44px 34px; overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.9);
}
.card-shimmer {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(135deg, rgba(56,163,245,0.04) 0%, transparent 50%, rgba(26,61,158,0.03) 100%);
  animation: shimmerPulse 6s ease-in-out infinite alternate;
}
@keyframes shimmerPulse { from { opacity: 0.5; } to { opacity: 1; } }


.logo-wrap { display: flex; justify-content: center; margin-bottom: 28px; }
.logo-img {
  height: 180px; width: auto; object-fit: contain;
  filter: drop-shadow(0 2px 12px rgba(26,61,158,0.2));
  animation: logoFloat 5s ease-in-out infinite alternate;
}
@keyframes logoFloat {
  from { transform: translateY(0); }
  to   { transform: translateY(-5px); filter: drop-shadow(0 8px 20px rgba(26,61,158,0.25)); }
}


.field { margin-bottom: 16px; }
.field-label { display: block; font-size: 11px; font-weight: 600; color: #6b7196; margin-bottom: 7px; letter-spacing: 0.09em; text-transform: uppercase; }
.input-row {
  display: flex; align-items: center;
  background: #f8f9fc; border: 1.5px solid #e5e7f0; border-radius: 12px; overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.input-row:focus-within { border-color: #38a3f5; box-shadow: 0 0 0 3px rgba(56,163,245,0.12); background: #fff; }
.inp { flex: 1; background: none; border: none; outline: none; color: #08174a; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 12px 14px; }
.inp::placeholder { color: #b0b5cc; }
.domain { padding: 0 14px 0 2px; font-size: 13px; color: #1a7ddc; font-weight: 600; white-space: nowrap; }
.eye { background: none; border: none; cursor: pointer; color: #b0b5cc; padding: 0 12px; display: flex; align-items: center; transition: color 0.2s; }
.eye:hover { color: #1a3d9e; }

.row-between { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.remember { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.custom-check {
  width: 17px; height: 17px; border-radius: 5px;
  border: 1.5px solid #d8dbe9; background: #f8f9fc;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, border-color 0.2s; cursor: pointer; flex-shrink: 0;
}
.custom-check.checked { background: #1a7ddc; border-color: #1a7ddc; }
.remember span:last-child { font-size: 13px; color: #6b7196; }
.forgot { font-size: 13px; color: #1a7ddc; text-decoration: none; transition: color 0.2s; }
.forgot:hover { color: #0d2160; }

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
  border-radius: 0 0 0 10px;
  animation: errCountdown 5s linear forwards;
}
@keyframes errCountdown { from { width: 100%; } to { width: 0%; } }

.err-slide-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.err-slide-leave-active { transition: all 0.3s ease; }
.err-slide-enter-from   { opacity: 0; transform: translateY(-8px); max-height: 0; }
.err-slide-enter-to     { opacity: 1; transform: translateY(0); max-height: 60px; }
.err-slide-leave-from   { opacity: 1; transform: translateY(0); max-height: 60px; }
.err-slide-leave-to     { opacity: 0; transform: translateY(-8px); max-height: 0; }


.login-btn {
  width: 100%; height: 46px; border: none; border-radius: 12px;
  cursor: pointer; position: relative; overflow: hidden; margin-bottom: 16px;
  transition: transform 0.15s, opacity 0.2s;
  font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600;
  color: #fff; letter-spacing: 0.05em; background: transparent;
}
.btn-bg { position: absolute; inset: 0; border-radius: 12px; background: linear-gradient(135deg, #0d2160 0%, #1a3d9e 40%, #38a3f5 100%); }
.btn-shine { position: absolute; inset: 0; border-radius: 12px; background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 55%); opacity: 0; transition: opacity 0.2s; }
.btn-content { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; }
.login-btn:hover:not(:disabled) .btn-shine { opacity: 1; }
.login-btn:hover:not(:disabled) { transform: translateY(-1px); }
.login-btn:active:not(:disabled) { transform: translateY(0); }
.login-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.spin { display: inline-block; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.divider { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.div-line { flex: 1; height: 1px; background: #e5e7f0; }
.div-text { font-size: 12px; color: #b0b5cc; letter-spacing: 0.06em; }

.ms-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 11px; background: #f8f9fc; border: 1.5px solid #e5e7f0;
  border-radius: 12px; color: #3c4157; font-family: 'DM Sans', sans-serif;
  font-size: 14px; cursor: pointer; transition: background 0.2s, border-color 0.2s;
}
.ms-btn:hover { background: #eaf0fb; border-color: #c9d9f4; color: #0d2160; }
</style>
