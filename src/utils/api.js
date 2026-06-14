export function apiFetch(url, option = {}) {
    const token = localStorage.getItem("token");
    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
             ...(token ? { "Authorization": `Bearer ${token}` } : {}),
             ...options.headers,
        },
    });
}