// API client + auth token storage.
// In dev, Vite proxies /api/* to the backend. In prod, VITE_API_URL points
// directly at the backend. Either way the browser sees same-origin requests.

const TOKEN_KEY = "mi_admin_token";
const EMAIL_KEY = "mi_admin_email";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function setSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : null) ?? `Request failed: ${res.status}`;
    // 401 = session expired/invalid → clear and force re-login.
    if (res.status === 401) {
      clearSession();
      // Reload to /login if not already there.
      if (!location.pathname.startsWith("/login")) {
        location.href = "/login";
      }
    }
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}

// ---- Typed endpoints ----

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  phone: string;
};

export type Order = {
  id: string;
  userId: string | null;
  customerEmail: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  status: string;
  payment: Record<string, unknown>;
  shippingInfo: {
    shiprocketOrderId?: string;
    awb?: string;
    courier?: string;
    trackingUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type Subscriber = {
  id: string;
  email: string;
  source: string;
  createdAt: string;
};

export type ReplacementRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderId: string | null;
  productName: string | null;
  reason: string;
  message: string;
  status: "pending" | "approved" | "declined" | "resolved";
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Stats = {
  orders: number;
  paidOrders: number;
  products: number;
  users: number;
  revenue: number;
  subscribers: number;
};

export const adminApi = {
  login: (email: string, password: string) =>
    api<{ token: string; email: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  stats: () => api<Stats>("/api/admin/stats"),

  orders: (params: { limit?: number; skip?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.limit) q.set("limit", String(params.limit));
    if (params.skip) q.set("skip", String(params.skip));
    if (params.status) q.set("status", params.status);
    return api<{ orders: Order[]; total: number; limit: number; skip: number }>(
      `/api/admin/orders?${q}`
    );
  },

  order: (id: string) => api<{ order: Order }>(`/api/admin/orders/${id}`),

  updateStatus: (id: string, status: string) =>
    api<{ order: Order }>(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  track: (id: string) =>
    api<{ awb: string; tracking: unknown; stub?: boolean }>(
      `/api/admin/orders/${id}/track`
    ),

  subscribers: (params: { limit?: number; skip?: number; q?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.limit) q.set("limit", String(params.limit));
    if (params.skip) q.set("skip", String(params.skip));
    if (params.q) q.set("q", params.q);
    return api<{ subscribers: Subscriber[]; total: number; limit: number; skip: number }>(
      `/api/admin/newsletter/subscribers?${q}`
    );
  },

  replacementRequests: (params: { limit?: number; skip?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.limit) q.set("limit", String(params.limit));
    if (params.skip) q.set("skip", String(params.skip));
    if (params.status) q.set("status", params.status);
    return api<{
      requests: ReplacementRequest[];
      total: number;
      limit: number;
      skip: number;
    }>(`/api/admin/replacement-requests?${q}`);
  },

  replacementRequest: (id: string) =>
    api<{ request: ReplacementRequest }>(`/api/admin/replacement-requests/${id}`),

  updateReplacementRequest: (
    id: string,
    body: { status: string; adminNotes?: string }
  ) =>
    api<{ request: ReplacementRequest }>(
      `/api/admin/replacement-requests/${id}`,
      { method: "PATCH", body: JSON.stringify(body) }
    ),
};
