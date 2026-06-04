import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const authToken = ref(localStorage.getItem("rfq_auth_token") || null);
    const authRole = ref(localStorage.getItem("rfq_auth_role") || null);
    const user = ref(null);

    const isAuthenticated = computed(() => !!authToken.value);
    const isAdmin = computed(() => authRole.value === 'admin');

    function setAuth(newToken, newRole, userData) {
        authToken.value = newToken;
        authRole.value = newRole;
        user.value = userData;
        localStorage.setItem("rfq_auth_token", newToken);
        localStorage.setItem("rfq_auth_role", newRole);
    }

    function logout() {
        authToken.value = null;
        authRole.value = null;
        user.value = null;
        localStorage.removeItem("rfq_auth_token");
        localStorage.removeItem("rfq_auth_role");
    }

    return {
        authToken,
        authRole,
        user,
        isAuthenticated,
        isAdmin,
        setAuth,
        logout
    };
});