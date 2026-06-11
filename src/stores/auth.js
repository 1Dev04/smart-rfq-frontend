import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const authToken = ref(localStorage.getItem("rfq_auth_token") || null);
  const authRole = ref(localStorage.getItem("rfq_auth_role") || null);
  const user = ref(JSON.parse(localStorage.getItem("rfq_auth_user") || "null"));

  const isAuthenticated = computed(() => !!authToken.value);
  const isAdmin = computed(() => authRole.value === 'admin');
  const isPurchaser = computed(() => authRole.value === 'purchaser');
  const role = computed(() => authRole.value || 'user');

  function setAuth(newToken, newRole, userData) {
    authToken.value = newToken;
    authRole.value = newRole;
    user.value = userData;
    localStorage.setItem("rfq_auth_token", newToken);
    localStorage.setItem("rfq_auth_role", newRole);
    localStorage.setItem("rfq_auth_user", JSON.stringify(userData));
  }

  function logout() {
    authToken.value = null;
    authRole.value = null;
    user.value = null;
    localStorage.removeItem("rfq_auth_token");
    localStorage.removeItem("rfq_auth_role");
    localStorage.removeItem("rfq_auth_user");
  }

  return {
    authToken,
    authRole,
    user,
    isAuthenticated,
    isAdmin,
    isPurchaser,
    role,
    setAuth,
    logout
  };
});