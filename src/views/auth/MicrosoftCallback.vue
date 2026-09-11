<script setup>
import { onMounted, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const status = ref("loading"); // loading | success | error
const errorMsg = ref("");

const steps = reactive([
  { id: "code", label: "ตรวจสอบรหัสอ้างอิง", status: "pending" },
  { id: "conn", label: "เชื่อมต่อ Microsoft Entra ID", status: "pending" },
  { id: "perm", label: "ตรวจสอบสิทธิ์การใช้งาน", status: "pending" },
  { id: "open", label: "เปิดใช้งานบัญชี", status: "pending" },
]);

function setStep(id, s) {
  const st = steps.find((x) => x.id === id);
  if (st) st.status = s;
}
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let _called = false;
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const urlError = params.get("error");

const codeVerifier = sessionStorage.getItem("pkce_verifier") ?? "";
sessionStorage.removeItem("pkce_verifier");
window.history.replaceState({}, "", "/auth/microsoft/callback");
const BASE = `${import.meta.env.VITE_API_URL}`;

onMounted(async () => {
  if (_called) return;
  _called = true;

  await delay(350);
  if (urlError || !code) {
    setStep("code", "error");
    status.value = "error";
    errorMsg.value = urlError || "ไม่พบรหัสอ้างอิงจาก Microsoft";
    return;
  }
  setStep("code", "done");

  setStep("conn", "active");
  let res;
  try {
    const payload = { code, codeVerifier };
    res = await fetch(`${BASE}/auth/microsoft/callback`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    setStep("conn", "error");
    status.value = "error";
    errorMsg.value = "เชื่อมต่อ server ไม่สำเร็จ";
    return;
  }

  if (!res.ok && res.status !== 403) {
    setStep("conn", "error");
    status.value = "error";
    errorMsg.value = "เชื่อมต่อ server ไม่สำเร็จ";
    return;
  }
  setStep("conn", "done");

  setStep("perm", "active");
  await delay(400);

  if (res.status === 403) {
    setStep("perm", "error");
    status.value = "error";
    errorMsg.value = "ไม่มีสิทธิ์เข้าใช้งานระบบ";
    return;
  }
  setStep("perm", "done");

  setStep("open", "active");
  let data;
  try {
    data = await res.json();
  } catch (e) {
    setStep("open", "error");
    status.value = "error";
    errorMsg.value = "ข้อมูลตอบกลับไม่ถูกต้อง";
    return;
  }

  await delay(400);
  auth.setAuth(data.token, data.role, {
    email: data.email,
    name: data.displayName,
  });

  setStep("open", "done");
  status.value = "success";

  setTimeout(() => {
    router.push(
      data.role === "admin"
        ? "/admin"
        : data.role === "purchase"
          ? "/purchase"
          : "/doc-request-user",
    );
  }, 1600);
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
          <!-- ฉากพื้นหลัง: บ้าน/ต้นไม้/เนินเขา (parallax) -->
          <div class="bg-layer bg-hills" :class="{ stopped: status !== 'loading' }" />
          <div class="bg-layer bg-village" :class="{ stopped: status !== 'loading' }" />

          <!-- Company (โผล่ตอน success) -->
          <div :class="['company', { show: status === 'success' }]">
            <svg width="70" height="75" viewBox="0 0 70 75" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="20" width="60" height="52" fill="#B5D4F4" rx="3" />
              <rect x="5" y="12" width="14" height="16" fill="#85B7EB" rx="2" />
              <rect x="23" y="6" width="14" height="22" fill="#85B7EB" rx="2" />
              <rect x="41" y="15" width="12" height="13" fill="#85B7EB" rx="2" />
              <rect x="10" y="40" width="14" height="18" fill="#378ADD" rx="2" />
              <rect x="29" y="44" width="12" height="14" fill="#378ADD" rx="2" />
              <rect x="46" y="46" width="10" height="12" fill="#378ADD" rx="2" />
              <rect x="14" y="52" width="6" height="8" fill="#E6F1FB" rx="1" />
              <rect x="34" y="54" width="5" height="7" fill="#E6F1FB" rx="1" />
              <rect x="5" y="70" width="60" height="3" fill="#185FA5" rx="1" />
              <circle cx="12" cy="10" r="3" fill="#EF9F27" :style="status === 'success' ? 'animation:blink 1s 0s ease-in-out infinite' : 'opacity:0'" />
              <circle cx="30" cy="4" r="3" fill="#EF9F27" :style="status === 'success' ? 'animation:blink 1s .3s ease-in-out infinite' : 'opacity:0'" />
              <circle cx="47" cy="13" r="3" fill="#EF9F27" :style="status === 'success' ? 'animation:blink 1s .6s ease-in-out infinite' : 'opacity:0'" />
            </svg>
            <span class="company-label">TJG Co.,Ltd.</span>
          </div>

          <!-- Error sign (หน้ารถ) -->
          <div v-if="status === 'error'" class="error-sign">
            <svg width="40" height="58" viewBox="0 0 40 58" xmlns="http://www.w3.org/2000/svg">
              <rect x="18" y="38" width="4" height="20" fill="#888780" rx="1" />
              <circle cx="20" cy="20" r="18" fill="#E24B4A" />
              <circle cx="20" cy="20" r="18" fill="none" stroke="white" stroke-width="2.5" />
              <circle cx="20" cy="20" r="15" fill="white" opacity="0.95" />
              <rect x="18.8" y="13" width="2.4" height="8" fill="#E24B4A" rx="1.2" />
              <circle cx="20" cy="25" r="1.5" fill="#E24B4A" />
            </svg>
          </div>

          <!-- Truck body (uiverse original SVG) -->
          <div :class="['truckBody', { stopped: status !== 'loading' }]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 198 93" class="trucksvg">
              <path stroke-width="3" stroke="#282828" fill="#38a3f5"
                d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z" />
              <path stroke-width="3" stroke="#282828" fill="#7D7C7C"
                d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z" />
              <path stroke-width="2" stroke="#282828" fill="#282828"
                d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z" />
              <rect stroke-width="2" stroke="#282828" fill="#FFFCAB" rx="1" height="7" width="5" y="63" x="187" />
              <rect stroke-width="2" stroke="#282828" fill="#282828" rx="1" height="11" width="4" y="81" x="193" />
              <rect stroke-width="3" stroke="#282828" fill="#DFDFDF" rx="2.5" height="90" width="121" y="1.5" x="6.5" />
              <rect stroke-width="2" stroke="#282828" fill="#DFDFDF" rx="2" height="4" width="6" y="84" x="1" />
              <text x="50" y="55" text-anchor="middle" font-size="30" font-weight="700" fill="#282828" font-family="sans-serif">LPG</text>
              <rect x="110" y="8" width="5" height="5" fill="#F25022" rx="0.5" />
              <rect x="116" y="8" width="5" height="5" fill="#7FBA00" rx="0.5" />
              <rect x="110" y="14" width="5" height="5" fill="#00A4EF" rx="0.5" />
              <rect x="116" y="14" width="5" height="5" fill="#FFB900" rx="0.5" />
            </svg>
          </div>

          <!-- Tires -->
          <div class="truckTires">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30" :class="['tiresvg', { stopped: status !== 'loading' }]">
              <circle stroke-width="3" stroke="#282828" fill="#282828" r="13.5" cy="15" cx="15" />
              <circle fill="#DFDFDF" r="7" cy="15" cx="15" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30" :class="['tiresvg', { stopped: status !== 'loading' }]">
              <circle stroke-width="3" stroke="#282828" fill="#282828" r="13.5" cy="15" cx="15" />
              <circle fill="#DFDFDF" r="7" cy="15" cx="15" />
            </svg>
          </div>

          <!-- Road -->
          <div :class="['road', { stopped: status !== 'loading' }]" />

          <!-- Lamp post -->
          <svg viewBox="0 0 453.459 453.459" xmlns="http://www.w3.org/2000/svg" fill="#888780" :class="['lampPost', { stopped: status !== 'loading' }]">
            <path d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0zM232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017h78.747C231.693,100.736,232.77,106.162,232.77,111.694z" />
          </svg>
        </div>
      </div>

      <!-- ── รายการวาล์วตรวจสอบ ── -->
      <div class="valve-list">
        <div v-for="(s, i) in steps" :key="s.id" class="valve-row">
          <div class="valve-track">
            <div class="valve-node" :class="s.status">
              <svg v-if="s.status === 'done'" viewBox="0 0 16 16" class="node-icon">
                <path d="M3 8.5L6.5 12L13 4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="s.status === 'error'" viewBox="0 0 16 16" class="node-icon">
                <path d="M4 4L12 12M12 4L4 12" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" />
              </svg>
              <div v-else-if="s.status === 'active'" class="node-spin" />
            </div>
            <div v-if="i < steps.length - 1" class="valve-pipe"
              :class="{ filled: steps[i].status === 'done', leaking: steps[i].status === 'error' }" />
          </div>
          <div class="valve-label" :class="s.status">{{ s.label }}</div>
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

      <!-- Retry -->
      <button v-if="status === 'error'" class="retry-btn" @click="retry">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
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

/* ── Uiverse truck (ต้นฉบับ) ── */
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
  border-radius: 12px;
}

/* ── ฉากพื้นหลัง: บ้าน/ต้นไม้/เนินเขา (เพิ่มใหม่ ซ้อนหลังรถ) ── */
.bg-layer {
  position: absolute;
  left: 0;
  right: 0;
  background-repeat: repeat-x;
  z-index: 0;
}
.bg-hills {
  top: 0;
  bottom: 20px;
  background: linear-gradient(180deg, #bfe3ff 0%, #dff0ff 55%, #eef9ff 100%);
  background-image:
    linear-gradient(180deg, #bfe3ff 0%, #dff0ff 55%, #eef9ff 100%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='60' viewBox='0 0 300 60'%3E%3Cpath d='M0 60 Q40 20 90 40 T180 35 T300 45 V60 Z' fill='%23bcd9c2'/%3E%3Cpath d='M0 60 Q60 35 130 50 T260 42 T300 55 V60 Z' fill='%23a4cbaf'/%3E%3C/svg%3E");
  background-position: top left, bottom left;
  background-size: 100% 100%, 300px 60px;
  animation: scrollBgSlow 34s linear infinite;
}
.bg-village {
  bottom: 20px;
  height: 58px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='58' viewBox='0 0 220 58'%3E%3Ccircle cx='22' cy='30' r='16' fill='%233a6b52'/%3E%3Crect x='19' y='42' width='6' height='14' fill='%234a3a2a'/%3E%3Ccircle cx='45' cy='38' r='10' fill='%23336048'/%3E%3Crect x='42' y='46' width='4' height='10' fill='%234a3a2a'/%3E%3Crect x='95' y='24' width='46' height='32' fill='%23e7ddc8' rx='2'/%3E%3Cpolygon points='90,24 118,4 146,24' fill='%23c4694a'/%3E%3Crect x='113' y='38' width='10' height='18' fill='%237a5a3a'/%3E%3Crect x='102' y='32' width='8' height='8' fill='%237fa8c9'/%3E%3Ccircle cx='185' cy='34' r='13' fill='%233a6b52'/%3E%3Crect x='182' y='45' width='6' height='11' fill='%234a3a2a'/%3E%3C/svg%3E");
  background-size: 220px 58px;
  animation: scrollBg 13s linear infinite;
}
.bg-layer.stopped {
  animation-play-state: paused;
}
@keyframes scrollBg {
  from { background-position-x: 0; }
  to { background-position-x: -220px; }
}
@keyframes scrollBgSlow {
  from { background-position-x: 0, 0; }
  to { background-position-x: 0, -300px; }
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
  0% { transform: translateY(0); }
  50% { transform: translateY(3px); }
  100% { transform: translateY(0); }
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  0% { transform: translateX(0); }
  100% { transform: translateX(-350px); }
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
  right: 6px;
  bottom: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: translateX(50px);
  transition: opacity 1s ease, transform 1s ease;
  z-index: 2;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
  border-radius: 12px;
  padding: 6px 8px 4px;
  box-shadow: 0 4px 14px rgba(20, 40, 70, 0.15);
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
  background: rgba(255, 255, 255, 0.9);
  padding: 1px 5px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
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
  from { transform: translateY(20px) scale(0.5); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

/* ── รายการวาล์วตรวจสอบ ── */
.valve-list {
  width: 100%;
  display: flex;
  flex-direction: column;
}
.valve-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.valve-track {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.valve-node {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #2a3b55;
  background: #10182a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}
.valve-node.active {
  border-color: #ff6b35;
  box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.15);
}
.valve-node.done {
  background: #22c55e;
  border-color: #22c55e;
}
.valve-node.error {
  background: #f04438;
  border-color: #f04438;
}
.node-icon {
  width: 12px;
  height: 12px;
}
.node-spin {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 107, 53, 0.25);
  border-top-color: #ff6b35;
  animation: nodespin 0.7s linear infinite;
}
@keyframes nodespin {
  to { transform: rotate(360deg); }
}
.valve-pipe {
  width: 2px;
  height: 26px;
  background: #1c2a42;
  transition: background 0.4s ease;
}
.valve-pipe.filled {
  background: #22c55e;
}
.valve-pipe.leaking {
  background: repeating-linear-gradient(to bottom, #f04438 0, #f04438 4px, transparent 4px, transparent 8px);
}
.valve-label {
  font-size: 13px;
  color: #7c8ba8;
  padding-top: 4px;
  padding-bottom: 22px;
  transition: color 0.3s ease;
}
.valve-label.active {
  color: #edf1f7;
  font-weight: 600;
}
.valve-label.done {
  color: #9db3a0;
}
.valve-label.error {
  color: #f04438;
  font-weight: 600;
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
.success-txt { color: #4ade80; }
.error-txt { color: #f87171; }

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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}
</style>