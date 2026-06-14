import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/auth/LoginView.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("../views/auth/ForgotPassword.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/doc-request",
    name: "Doc Request",
    component: () => import("../views/rfq/DocReqDashboard.vue"),
    meta: { requiresAuth: true, role: "user" },
  },
  {
    path: "/help-category",
    name: "Help Category",
    component: () => import("../views/rfq/HelpCategory.vue"),
    meta: { requiresAuth: true, role: "user" },
  },
  {
    path: "/audit-log",
    name: "Audit Log",
    component: () => import("../views/rfq/AuditLog.vue"),
    meta: { requiresAuth: true, role: "user" },
  },
  {
    path: "/theme",
    name: "Theme",
    component: () => import("../views/rfq/Theme.vue"),
    meta: { requiresAuth: true, role: "user" },
  },
  {
    path: "/admin",
    name: "AdminDashboard",
    component: () => import("../views/rfq/AdminDashboard.vue"),
    meta: { requiresAuth: true, role: "admin" },
  },
  {
    path: "/auth/microsoft/callback",
    name: "MicrosoftCallback",
    component: () => import("../views/auth/MicrosoftCallback.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let sessionRestored = false;

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  // Restore session แค่ครั้งเดียว
  if (!sessionRestored) {
    await auth.restoreSession();
    sessionRestored = true;
  }

  const isAuth = auth.isAuthenticated;
  const userRole = auth.authRole;

  // requiresAuth: ยังไม่ login → ไป Login
  if (to.meta.requiresAuth) {
    if (!isAuth) {
      return next({ name: "Login" });
    }
    // เช็ค role (admin ผ่านได้ทุกหน้า)
    if (to.meta.role && userRole !== to.meta.role && userRole !== "admin") {
      return next({
        name: userRole === "admin" ? "AdminDashboard" : "Doc Request",
      });
    }
  }

  // requiresGuest: login แล้วห้ามเข้า /login
  if (to.meta.requiresGuest && isAuth) {
    return next({
      name: userRole === "admin" ? "AdminDashboard" : "Doc Request",
    });
  }

  next();
});

export default router;