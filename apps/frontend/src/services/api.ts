export const BASE = import.meta.env.VITE_BACKEND_URL;
if (!BASE) throw new Error("VITE_BACKEND_URL is not set");

export async function apiFetch(path: string, options?: RequestInit) {
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) };
  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? res.statusText);
  }
  if (res.status === 204) return {};
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
  create: (url: string) =>
    apiFetch("/short-links", { method: "POST", body: JSON.stringify({ url }) }),
  remove: (slug: string) => apiFetch(`/short-links/${slug}`, { method: "DELETE" }),
};
