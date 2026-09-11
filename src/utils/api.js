import router from '../router/router.js';

export async function apiFetch(url, option = {}) {
  const isFormData = option.body instanceof FormData;

  const headers = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...option.headers,
  };

  const res = await fetch(url, {
    ...option,
    credentials: "include",
    headers,
  });

  if (res.status === 401 && !option.skipAuthRedirect) {
    router.push('/login');
    return res;
  }

  return res;
}