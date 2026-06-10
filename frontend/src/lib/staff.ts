import { API_BASE_URL, type Reservation, type ReservationStatus } from "./api";

export type StaffUser = {
  username: string;
  role: string;
};

export type ReservationFilters = {
  from_date?: string;
  to_date?: string;
  has_catering?: boolean;
  upcoming?: boolean;
  past?: boolean;
};

export type ReminderRunResult = {
  checked: number;
  sent: number;
  skipped: number;
  errors: string[];
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") {
      return body.detail;
    }
  } catch {
    // ignore body parse failure
  }
  return `Fehler ${res.status}`;
}

function apiUrl(path: string): string | null {
  if (!API_BASE_URL) return null;
  return `${API_BASE_URL}${path}`;
}

// Staff auth travels in an Authorization header rather than a cookie: the static
// frontend (github.io) and the API (onrender.com) live on different sites, so the
// session cookie is a third-party cookie that browsers block by default. The token
// is kept in localStorage and attached to every authenticated request instead.
const TOKEN_KEY = "rr_staff_token";

function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginStaff(
  username: string,
  password: string,
): Promise<ApiResult<StaffUser>> {
  const url = apiUrl("/auth/login");
  if (!url) return { ok: false, status: 0, message: "API nicht konfiguriert" };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, message: await parseError(res) };
  }
  const body = (await res.json()) as { token: string; user: StaffUser };
  setToken(body.token);
  return { ok: true, data: body.user };
}

export async function logoutStaff(): Promise<void> {
  const url = apiUrl("/auth/logout");
  if (url) {
    await fetch(url, {
      method: "POST",
      headers: { ...authHeaders() },
      credentials: "include",
    });
  }
  clearToken();
}

export async function getCurrentStaff(): Promise<StaffUser | null> {
  const url = apiUrl("/auth/me");
  if (!url) return null;
  const res = await fetch(url, {
    headers: { ...authHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as StaffUser;
}

export async function listStaffReservations(
  filters: ReservationFilters,
): Promise<ApiResult<Reservation[]>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  const path = `/reservations${query ? `?${query}` : ""}`;
  const url = apiUrl(path);
  if (!url) return { ok: false, status: 0, message: "API nicht konfiguriert" };

  const res = await fetch(url, {
    headers: { ...authHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    return { ok: false, status: res.status, message: await parseError(res) };
  }
  const body = (await res.json()) as { items?: Reservation[] };
  return { ok: true, data: body.items ?? [] };
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<ApiResult<Reservation>> {
  const url = apiUrl(`/reservations/${id}/status`);
  if (!url) return { ok: false, status: 0, message: "API nicht konfiguriert" };

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, message: await parseError(res) };
  }
  return { ok: true, data: (await res.json()) as Reservation };
}

export async function cancelReservation(
  id: string,
): Promise<ApiResult<Reservation>> {
  const url = apiUrl(`/reservations/${id}`);
  if (!url) return { ok: false, status: 0, message: "API nicht konfiguriert" };

  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...authHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    return { ok: false, status: res.status, message: await parseError(res) };
  }
  return { ok: true, data: (await res.json()) as Reservation };
}

export async function runReminders(): Promise<ApiResult<ReminderRunResult>> {
  const url = apiUrl("/reminders/run");
  if (!url) return { ok: false, status: 0, message: "API nicht konfiguriert" };

  const res = await fetch(url, {
    method: "POST",
    headers: { ...authHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    return { ok: false, status: res.status, message: await parseError(res) };
  }
  return { ok: true, data: (await res.json()) as ReminderRunResult };
}
