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
  return { ok: true, data: (await res.json()) as StaffUser };
}

export async function logoutStaff(): Promise<void> {
  const url = apiUrl("/auth/logout");
  if (!url) return;
  await fetch(url, { method: "POST", credentials: "include" });
}

export async function getCurrentStaff(): Promise<StaffUser | null> {
  const url = apiUrl("/auth/me");
  if (!url) return null;
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
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

  const res = await fetch(url, { credentials: "include", cache: "no-store" });
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
    headers: { "Content-Type": "application/json" },
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
    credentials: "include",
  });
  if (!res.ok) {
    return { ok: false, status: res.status, message: await parseError(res) };
  }
  return { ok: true, data: (await res.json()) as ReminderRunResult };
}
