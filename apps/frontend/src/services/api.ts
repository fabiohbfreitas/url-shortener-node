const BASE = "http://localhost:3000";

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? res.statusText);
  }
  return res.json();
}

export const authApi = {
  sendCode: (email: string) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email }) }),
  verify: (email: string, code: string) =>
    apiFetch("/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) }),
  me: () => apiFetch("/auth/me"),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
};

export const shortLinksApi = {
  list: (page = 1, limit = 10) => apiFetch(`/short-links?page=${page}&limit=${limit}`),
};
