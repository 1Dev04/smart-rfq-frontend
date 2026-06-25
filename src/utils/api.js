

export function apiFetch(url, option = {}) {
    return fetch(url, {
        ...option,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...option.headers,
        },
    });
}