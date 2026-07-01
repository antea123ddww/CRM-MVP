const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const LOGIN_PATH = "/login";
const GET_CACHE_TTL_MS = 30_000;

type CacheEntry = {
  expiresAt: number;
  request: Promise<unknown>;
};

const getCache = new Map<string, CacheEntry>();

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] || null
  );
}

function clearSession() {
  getCache.clear();
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("csrfToken");
  localStorage.removeItem("user");
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });

  if (!res.ok) return null;

  const data = await res.json();

  if (!data.token) return null;

  localStorage.setItem("token", data.token);
  return data.token as string;
}

async function requestApi(
  path: string,
  options: RequestInit,
  token: string | null
) {
  const method = options.method || "GET";
  const csrfToken = getCookie("csrfToken");

  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(method !== "GET" && csrfToken
          ? { "X-CSRF-Token": decodeURIComponent(csrfToken) }
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
  const cacheKey = `${token || "anonymous"}:${path}`;

  if (method === "GET") {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.request;
    }
    getCache.delete(cacheKey);
  } else {
    getCache.clear();
  }

  const request = performApiFetch(path, options, token);

  if (method === "GET") {
    getCache.set(cacheKey, {
      expiresAt: Date.now() + GET_CACHE_TTL_MS,
      request,
    });
    request.catch(() => getCache.delete(cacheKey));
  }

  return request;
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
