<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const status = ref("loading");
const errorMsg = ref("");
const progress = ref(0);
let progTimer = null;
let _called = false;

const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const urlError = params.get("error");

const codeVerifier = sessionStorage.getItem("pkce_verifier") ?? "";
sessionStorage.removeItem("pkce_verifier");
window.history.replaceState({}, "", "/auth/microsoft/callback");
const BASE = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL_BACKEND}`;

function animProg(target, ms) {
  clearInterval(progTimer);
  const start = progress.value;
  const steps = ms / 40;
  const inc = (target - start) / steps;
  progTimer = setInterval(() => {
    progress.value += inc;
    if (
      (inc > 0 && progress.value >= target) ||
      (inc < 0 && progress.value <= target)
    ) {
      progress.value = target;
      clearInterval(progTimer);
    }
  }, 40);
}


onMounted(async () => {
  if (_called) return;
  _called = true;

  animProg(55, 2000);

  if (urlError || !code) {
    status.value = "error";
    errorMsg.value = urlError || "ไม่พบ authorization code";
    animProg(30, 400);
    return;
  }



  try {
    const res = await fetch(`${BASE}/microsoft/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ส่ง codeVerifier ไปด้วย
      body: JSON.stringify({ code, codeVerifier }),
    });

    if (res.status === 403) {
      status.value = "error";
      errorMsg.value = "ไม่มีสิทธิ์เข้าใช้งานระบบ";
      animProg(30, 400);
      return;
    }

    if (!res.ok) {
      status.value = "error";
      errorMsg.value = "เชื่อมต่อ server ไม่สำเร็จ";
      animProg(30, 400);
      return;
    }

    const data = await res.json();
    auth.setAuth(data.token, data.role, {
      email: data.email,
      name: data.displayName,
    });

    status.value = "success";
    animProg(100, 2000);
    setTimeout(() => {
      router.push(
        data.role === "admin"
          ? "/admin"
          : data.role === "purchaser"
            ? "/purchaser"
            : "/doc-request-user",
      );
    }, 3500);
  } catch (e) {
    status.value = "error";
    errorMsg.value = "เชื่อมต่อ server ไม่สำเร็จ";
    animProg(30, 400);
  }
});

function retry() {
  router.push("/login");
}
</script>

<template>
  <div class="cb-root">
    <div class="cb-card">
      <!-- Truck scene -->
      <div class="loader">
        <div class="truckWrapper">
          <!-- Company (โผล่ตอน success) -->
          <div :class="['company', { show: status === 'success' }]">
            <svg
              width="70"
              height="75"
              viewBox="0 0 70 75"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="5" y="20" width="60" height="52" fill="#B5D4F4" rx="3" />
              <rect x="5" y="12" width="14" height="16" fill="#85B7EB" rx="2" />
              <rect x="23" y="6" width="14" height="22" fill="#85B7EB" rx="2" />
              <rect
                x="41"
                y="15"
                width="12"
                height="13"
                fill="#85B7EB"
                rx="2"
              />
              <rect
                x="10"
                y="40"
                width="14"
                height="18"
                fill="#378ADD"
                rx="2"
              />
              <rect
                x="29"
                y="44"
                width="12"
                height="14"
                fill="#378ADD"
                rx="2"
              />
              <rect
                x="46"
                y="46"
                width="10"
                height="12"
                fill="#378ADD"
                rx="2"
              />
              <rect x="14" y="52" width="6" height="8" fill="#E6F1FB" rx="1" />
              <rect x="34" y="54" width="5" height="7" fill="#E6F1FB" rx="1" />
              <rect x="5" y="70" width="60" height="3" fill="#185FA5" rx="1" />
              <circle
                cx="12"
                cy="10"
                r="3"
                fill="#EF9F27"
                :style="
                  status === 'success'
                    ? 'animation:blink 1s 0s ease-in-out infinite'
                    : 'opacity:0'
                "
              />
              <circle
                cx="30"
                cy="4"
                r="3"
                fill="#EF9F27"
                :style="
                  status === 'success'
                    ? 'animation:blink 1s .3s ease-in-out infinite'
                    : 'opacity:0'
                "
              />
              <circle
                cx="47"
                cy="13"
                r="3"
                fill="#EF9F27"
                :style="
                  status === 'success'
                    ? 'animation:blink 1s .6s ease-in-out infinite'
                    : 'opacity:0'
                "
              />
            </svg>
            <span class="company-label">TJG Co.,Ltd.</span>
          </div>

          <!-- Smoke (loading only) -->
          <div v-if="status === 'loading'" class="smoke-wrap">
            <div class="smoke-dot d1" />
            <div class="smoke-dot d2" />
            <div class="smoke-dot d3" />
          </div>

          <!-- Error sign (หน้ารถ) -->
          <div v-if="status === 'error'" class="error-sign">
            <svg
              width="40"
              height="58"
              viewBox="0 0 40 58"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- เสาป้าย -->
              <rect x="18" y="38" width="4" height="20" fill="#888780" rx="1" />
              <!-- วงกลมสีแดง -->
              <circle cx="20" cy="20" r="18" fill="#E24B4A" />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="white"
                stroke-width="2.5"
              />
              <!-- สามเหลี่ยมขาวข้างใน -->
              <circle cx="20" cy="20" r="15" fill="white" opacity="0.95" />
              <!-- ! ข้างในสามเหลี่ยม -->
              <rect
                x="18.8"
                y="13"
                width="2.4"
                height="8"
                fill="#E24B4A"
                rx="1.2"
              />
              <circle cx="20" cy="25" r="1.5" fill="#E24B4A" />
            </svg>
          </div>
          <!-- Truck body (uiverse original SVG) -->
          <div :class="['truckBody', { stopped: status !== 'loading' }]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 198 93"
              class="trucksvg"
            >
              <path
                stroke-width="3"
                stroke="#282828"
                fill="#38a3f5"
                d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
              />
              <path
                stroke-width="3"
                stroke="#282828"
                fill="#7D7C7C"
                d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
              />
              <path
                stroke-width="2"
                stroke="#282828"
                fill="#282828"
                d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"
              />
              <rect
                stroke-width="2"
                stroke="#282828"
                fill="#FFFCAB"
                rx="1"
                height="7"
                width="5"
                y="63"
                x="187"
              />
              <rect
                stroke-width="2"
                stroke="#282828"
                fill="#282828"
                rx="1"
                height="11"
                width="4"
                y="81"
                x="193"
              />
              <rect
                stroke-width="3"
                stroke="#282828"
                fill="#DFDFDF"
                rx="2.5"
                height="90"
                width="121"
                y="1.5"
                x="6.5"
              />
              <rect
                stroke-width="2"
                stroke="#282828"
                fill="#DFDFDF"
                rx="2"
                height="4"
                width="6"
                y="84"
                x="1"
              />
              <!-- LPG label -->
              <text
                x="50"
                y="55"
                text-anchor="middle"
                font-size="30"
                font-weight="700"
                fill="#282828"
                font-family="sans-serif"
              >
                LPG
              </text>
              <!-- MS logo on cab -->
              <rect
                x="110"
                y="8"
                width="5"
                height="5"
                fill="#F25022"
                rx="0.5"
              />
              <rect
                x="116"
                y="8"
                width="5"
                height="5"
                fill="#7FBA00"
                rx="0.5"
              />
              <rect
                x="110"
                y="14"
                width="5"
                height="5"
                fill="#00A4EF"
                rx="0.5"
              />
              <rect
                x="116"
                y="14"
                width="5"
                height="5"
                fill="#FFB900"
                rx="0.5"
              />
            </svg>
          </div>

          <!-- Tires -->
          <div class="truckTires">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 30 30"
              :class="['tiresvg', { stopped: status !== 'loading' }]"
            >
              <circle
                stroke-width="3"
                stroke="#282828"
                fill="#282828"
                r="13.5"
                cy="15"
                cx="15"
              />
              <circle fill="#DFDFDF" r="7" cy="15" cx="15" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 30 30"
              :class="['tiresvg', { stopped: status !== 'loading' }]"
            >
              <circle
                stroke-width="3"
                stroke="#282828"
                fill="#282828"
                r="13.5"
                cy="15"
                cx="15"
              />
              <circle fill="#DFDFDF" r="7" cy="15" cx="15" />
            </svg>
          </div>

          <!-- Road -->
          <div :class="['road', { stopped: status !== 'loading' }]" />

          <!-- Lamp post -->
          <svg
            viewBox="0 0 453.459 453.459"
            xmlns="http://www.w3.org/2000/svg"
            fill="#888780"
            :class="['lampPost', { stopped: status !== 'loading' }]"
          >
            <path
              d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0zM232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017h78.747C231.693,100.736,232.77,106.162,232.77,111.694z"
            />
          </svg>
        </div>
      </div>

      <!-- Status text -->
      <div class="status-area">
        <template v-if="status === 'loading'">
          <p class="s-title">กำลังยืนยันตัวตน...</p>
          <p class="s-sub">รถกำลังส่งแก๊สไปโรงงาน รอสักครู่</p>
        </template>
        <template v-else-if="status === 'success'">
          <p class="s-title success-txt">ถึงโรงงานแล้ว!</p>
          <p class="s-sub">ยืนยันตัวตนสำเร็จ กำลังเข้าสู่ระบบ...</p>
        </template>
        <template v-else>
          <p class="s-title error-txt">รถหยุดกลางทาง</p>
          <p class="s-sub">{{ errorMsg }}</p>
        </template>
      </div>

      <!-- Progress bar -->
      <div class="prog-wrap">
        <div class="prog-bar">
          <div
            class="prog-fill"
            :class="{ done: status === 'success', fail: status === 'error' }"
            :style="{ width: Math.round(progress) + '%' }"
          />
        </div>
      </div>

      <!-- Retry -->
      <button v-if="status === 'error'" class="retry-btn" @click="retry">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        ลองใหม่
      </button>
    </div>
  </div>
</template>

<style scoped>
.cb-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base, #060c18);
  font-family: "DM Sans", sans-serif;
}
.cb-card {
  background: var(--bg-surface, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 20px;
  padding: 32px;
  width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* ── Uiverse truck ── */
.loader {
  width: fit-content;
}
.truckWrapper {
  width: 380px;
  height: 120px;
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}
.truckBody {
  width: 130px;
  margin-bottom: 6px;
  animation: motion 1s linear infinite;
  position: relative;
  z-index: 3;
}
.truckBody.stopped {
  animation: none;
}
@keyframes motion {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(3px);
  }
  100% {
    transform: translateY(0);
  }
}
.truckTires {
  width: 130px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 15px;
  position: absolute;
  bottom: 0;
  z-index: 3;
}
.truckTires svg {
  width: 24px;
}
.tiresvg {
  animation: tireSpin 0.4s linear infinite;
}
.tiresvg.stopped {
  animation: none;
}
@keyframes tireSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.road {
  width: 100%;
  height: 1.5px;
  background: #282828;
  position: relative;
  bottom: 0;
  align-self: flex-end;
  border-radius: 3px;
  z-index: 2;
}
.road::before {
  content: "";
  position: absolute;
  width: 20px;
  height: 100%;
  background: #282828;
  right: -50%;
  border-radius: 3px;
  animation: roadAnim 1.4s linear infinite;
  border-left: 10px solid white;
}
.road::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 100%;
  background: #282828;
  right: -65%;
  border-radius: 3px;
  animation: roadAnim 1.4s linear infinite;
  border-left: 4px solid white;
}
.road.stopped::before,
.road.stopped::after {
  animation: none;
}
@keyframes roadAnim {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-350px);
  }
}
.lampPost {
  position: absolute;
  bottom: 0;
  right: -90%;
  height: 80px;
  animation: roadAnim 1.4s linear infinite;
  z-index: 1;
}
.lampPost.stopped {
  animation: none;
}

/* ── Company ── */
.company {
  position: absolute;
  right: 0;
  bottom: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: translateX(50px);
  transition:
    opacity 1s ease,
    transform 1s ease;
  z-index: 2;
}
.company.show {
  opacity: 1;
  transform: translateX(0);
}
.company-label {
  font-size: 10px;
  font-weight: 700;
  color: #185fa5;
  margin-top: 2px;
  letter-spacing: 0.04em;
}

/* ── Smoke ── */
.smoke-wrap {
  position: absolute;
  bottom: 28px;
  left: 148px;
  z-index: 4;
  pointer-events: none;
}
.smoke-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #aaa;
  position: absolute;
  animation: smokeUp 1.2s ease-out infinite;
}
.d2 {
  width: 5px;
  height: 5px;
  left: -4px;
  animation-delay: 0.4s;
}
.d3 {
  width: 4px;
  height: 4px;
  left: 4px;
  animation-delay: 0.7s;
  background: #ccc;
}
@keyframes smokeUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.55;
  }
  100% {
    transform: translateY(-24px) scale(2);
    opacity: 0;
  }
}

/* ── Error X ── */
.error-sign {
  position: absolute;
  top: 70px;
  left: 308px;
  z-index: 5;
  animation: signPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes signPop {
  from {
    transform: translateY(20px) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* ── Status ── */
.status-area {
  text-align: center;
}
.s-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin-bottom: 4px;
}
.s-sub {
  font-size: 13px;
  color: var(--text-muted, rgba(255, 255, 255, 0.45));
}
.success-txt {
  color: #4ade80;
}
.error-txt {
  color: #f87171;
}

/* ── Progress ── */
.prog-wrap {
  width: 100%;
}
.prog-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: #378add;
  border-radius: 999px;
  transition:
    width 1s ease,
    background 0.4s;
}
.prog-fill.done {
  background: #4ade80;
}
.prog-fill.fail {
  background: #f87171;
}

/* ── Retry ── */
.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.retry-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.15;
  }
}
</style>
