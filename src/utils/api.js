import router from '../router/router.js';

export async function apiFetch(url, option = {}) {
    const res = await fetch(url, {
        ...option,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...option.headers,
        },
    });

    if (res.status === 401 && !option.skipAuthRedirect) {
        router.push('/login');
        return res;
    }

    return res;
}