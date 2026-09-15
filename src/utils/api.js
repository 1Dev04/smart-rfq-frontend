import router from '../router/router.js';
import { useAuthStore } from '../stores/auth.js';

export async function apiFetch(url, option = {}) {
  const isFormData = option.body instanceof FormData;

  // ──  Authorization header ──
  // Safari บล็อก cross-site cookie (ITP) 
  const auth = useAuthStore();
  const token = auth.token;

  const headers = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...option.headers,
  };

  const res = await fetch(url, {
    ...option,
    credentials: "include", 
    headers,
  });

  if (res.status === 401 && !option.skipAuthRedirect) {
    auth.logout?.(); 
    router.push('/login');
    return res;
  }

  return res;
}