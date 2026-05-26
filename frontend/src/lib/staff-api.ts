import { API_BASE_URL, Reservation, ReservationStatus } from "./api";

const TOKEN_KEY = "staff_token";

export function getStaffToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStaffToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStaffToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getStaffToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface ReservationFilters {
  date_from?: string;
  date_to?: string;
  catering?: boolean;
  upcoming?: boolean;
  room?: string;
  status?: ReservationStatus;
}

export type StaffResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

async function staffFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<StaffResult<T>> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        if (body?.detail) message = body.detail;
      } catch {
        // ignore parse errors
      }
      return { ok: false, status: res.status, message };
    }

    if (res.status === 204) {
      return { ok: true, data: null as T };
    }

    const data: T = await res.json();
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function staffListReservations(
  filters: ReservationFilters = {}
): Promise<StaffResult<{ items: Reservation[] }>> {
  const params = new URLSearchParams();
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.catering !== undefined)
    params.set("catering", String(filters.catering));
  if (filters.upcoming !== undefined)
    params.set("upcoming", String(filters.upcoming));
  if (filters.room) params.set("room", filters.room);
  if (filters.status) params.set("status", filters.status);

  const qs = params.toString();
  return staffFetch<{ items: Reservation[] }>(
    `/staff/reservations${qs ? `?${qs}` : ""}`
  );
}

export async function staffGetReservation(
  id: string
): Promise<StaffResult<Reservation>> {
  return staffFetch<Reservation>(`/staff/reservations/${id}`);
}

export async function staffUpdateStatus(
  id: string,
  newStatus: ReservationStatus
): Promise<StaffResult<Reservation>> {
  return staffFetch<Reservation>(
    `/staff/reservations/${id}/status?new_status=${newStatus}`,
    { method: "PATCH" }
  );
}

export async function staffDeleteReservation(
  id: string
): Promise<StaffResult<null>> {
  return staffFetch<null>(`/staff/reservations/${id}`, { method: "DELETE" });
}
