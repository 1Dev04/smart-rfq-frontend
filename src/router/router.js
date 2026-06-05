import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginUser.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/auth/ForgotPassword.vue'),
    meta: { requiresGuest: true}
  },
  {
    path: '/doc-request-user',
    name: 'Doc Request',
    component: () => import('../views/rfq/DocReqDashboard.vue'),
    meta: { requiresAuth: true, role: 'user' }
  },
  {
    path: '/help-category',
    name: 'Help Category',
    component: () => import('../views/rfq/HelpCategory.vue'),
    meta: {requiresAuth: true, role: 'user' }
  },
  {
    path: '/theme',
    name: 'Theme',
    component: () => import('../views/rfq/Theme.vue'),
    meta: {requiresAuth: true, role: 'user'}
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/rfq/AdminDashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const auth  = useAuthStore()
  const token = auth.authToken
  const role  = auth.authRole

  if (to.meta.requiresAuth && !token) {
    return next({ name: 'Login' })
  }

  if (to.meta.requiresGuest && token) {
    return next({ name: role === 'admin' ? 'AdminDashboard' : 'Doc Request' })
  }

  if (to.meta.requiresAuth && to.meta.role) {
    if (role !== to.meta.role && role !== 'admin') {
      return next({ name: role === 'admin' ? 'AdminDashboard' : 'Doc Request' })
    }
  }

  next()
})

export default router