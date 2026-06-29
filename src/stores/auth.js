import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const authRole = ref(localStorage.getItem("rfq_auth_role") || null);
  const user = ref(JSON.parse(localStorage.getItem("rfq_auth_user") || "null"));
  const API_BASE = import.meta.env.VITE_LOCAL_BACKEND;

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => authRole.value === "admin");
  const isPurchase = computed(() => authRole.value === "purchase");
  const role = computed(() => {
    if (!authRole.value) return "user";
    if (authRole.value === "purchase") return "purchase";
    return authRole.value;
  });

  function setAuth(_token, newRole, userData) {
    authRole.value = newRole;
    user.value = userData;
    localStorage.setItem("rfq_auth_role", newRole);
    localStorage.setItem("rfq_auth_user", JSON.stringify(userData));
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
    localStorage.removeItem("rfq_auth_role");
    localStorage.removeItem("rfq_auth_user");
  }

  async function restoreSession() {
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/me`, {
        skipAuthRedirect: true,
      });
      if (!res.ok) {
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
    isAuthenticated,
    isAdmin,
    isPurchase,
    role,
    setAuth,
    logout,
    restoreSession,
  };
});
