import { API_BASE } from "../config/api";

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (res.status === 401) {
    // ✅ evita loop se siamo già su /login
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  return res;
}
