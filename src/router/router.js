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
  // {
  //   path: "/how-to-use",
  //   name: "How To Use",
  //   component: () => import("../views/rfq/HowToUse.vue"),
  //   meta: { requiresAuth: true, role: "user" },
  // },
  
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
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    const ok = await auth.restoreSession()
    if (!ok) return next({ name: "Login" }) 
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return next({
      name: auth.authRole === "admin" ? "AdminDashboard" : "Doc Request"
    })
  }

  if (to.meta.requiresAuth && to.meta.role) {
    const role = auth.authRole
    if (role !== "admin" && to.meta.role === "admin") {
      return next({ name: "Doc Request" })
    }
  }

  next()
})
export default router;