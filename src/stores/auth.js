import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiFetch } from "../utils/api.js";

export const useAuthStore = defineStore("auth", () => {
  const authRole = ref(localStorage.getItem("rfq_auth_role") || null);
  const user = ref(JSON.parse(localStorage.getItem("rfq_auth_user") || "null"));
  // ── token เก็บใน localStorage ของฝั่ง frontend เอง (same-origin)
  //    ไม่ใช่ cookie ข้าม domain เลย จึงไม่โดน Safari ITP บล็อก ──
  const token = ref(localStorage.getItem("rfq_auth_token") || null);
  const API_BASE = import.meta.env.VITE_API_URL;

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => authRole.value === "admin");
  const isPurchase = computed(() => authRole.value === "purchase");
  const role = computed(() => {
    if (!authRole.value) return "user";
    if (authRole.value === "purchase") return "purchase";
    return authRole.value;
  });

  function setAuth(newToken, newRole, userData) {
    authRole.value = newRole;
    user.value = userData;
    localStorage.setItem("rfq_auth_role", newRole);
    localStorage.setItem("rfq_auth_user", JSON.stringify(userData));

    if (newToken) {
      token.value = newToken;
      localStorage.setItem("rfq_auth_token", newToken);
    }
  }

  // เรียกแยกได้เฉพาะตอนอยากอัปเดต token เดี่ยวๆ (เช่น refresh token ใหม่)
  function setToken(newToken) {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem("rfq_auth_token", newToken);
    } else {
      localStorage.removeItem("rfq_auth_token");
    }
  }

  const isLoggingOut = ref(false);

  async function logout() {
    if (isLoggingOut.value) return;
    isLoggingOut.value = true;
    if (user.value) {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        skipAuthRedirect: true,
      }).catch(() => {});
    }
    authRole.value = null;
    user.value = null;
    token.value = null;
    localStorage.removeItem("rfq_auth_role");
    localStorage.removeItem("rfq_auth_user");
    localStorage.removeItem("rfq_auth_token");
    isLoggingOut.value = false;
  }

  async function restoreSession() {
    try {
      // ตอนนี้ token ถูกโหลดจาก localStorage เข้า ref ไว้แล้วตั้งแต่บรรทัดบนสุด
      // apiFetch จะดึง token.value จาก store นี้ไปแนบเป็น Authorization header ให้เอง
      const res = await apiFetch(`${API_BASE}/api/auth/me`, {
        skipAuthRedirect: true,
      });
      if (!res.ok) {
        // token ไม่มี/ใช้ไม่ได้แล้ว → เคลียร์ session เก่าทิ้ง กัน UI ค้างแสดงว่า "ล็อกอินอยู่" ทั้งที่ใช้งานจริงไม่ได้
        authRole.value = null;
        user.value = null;
        token.value = null;
        localStorage.removeItem("rfq_auth_role");
        localStorage.removeItem("rfq_auth_user");
        localStorage.removeItem("rfq_auth_token");
        return null;
      }
      const data = await res.json();
      setAuth(null, data.role, { email: data.email, name: data.fullName });
      return true;
    } catch {
      return false;
    }
  }

  return {
    authRole,
    user,
    token,
    isAuthenticated,
    isAdmin,
    isPurchase,
    role,
    setAuth,
    setToken,
    logout,
    restoreSession,
  };
});