const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is required.");
}
const LOGIN_PATH = "/login";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("csrfToken");
  localStorage.removeItem("user");
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) return null;

  const data = await res.json();

  if (!data.token) return null;

  localStorage.setItem("token", data.token);
  if (data.csrfToken) {
    localStorage.setItem("csrfToken", data.csrfToken);
  }
  return data.token as string;
}

async function requestApi(
  path: string,
  options: RequestInit,
  token: string | null
) {
  const method = options.method || "GET";
  const csrfToken = localStorage.getItem("csrfToken");

  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(method !== "GET" && csrfToken
          ? { "X-CSRF-Token": csrfToken }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Backend is not running or API URL is wrong.");
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const method = (options.method || "GET").toUpperCase();

  return performApiFetch(path, { ...options, method }, token);
}

async function performApiFetch(
  path: string,
  options: RequestInit,
  token: string | null
) {
  let res = await requestApi(path, options, token);

  if (res.status === 401) {
    const nextToken = await refreshAccessToken();

    if (nextToken) {
      res = await requestApi(path, options, nextToken);
    }
  }

  if (res.status === 401) {
    clearSession();

    if (window.location.pathname !== LOGIN_PATH) {
      window.location.replace(LOGIN_PATH);
    }

    return new Promise<never>(() => {});
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "API request failed");
  }

  return res.json();
}
