import type {
  EquipmentRequest,
  Reservation,
  ReservationCreate,
} from "./api";
import { API_BASE_URL } from "./api";
import type { BookingFormValues } from "./booking-schema";

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function padTime(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

export function buildPayload(
  form: BookingFormValues,
  date: Date,
): ReservationCreate {
  const iso = isoDate(date);
  const times = form.times[iso];
  const setupStart = times.setupStart || times.start;

  const equipment: EquipmentRequest[] = form.setup.equipment
    .filter((e) => e.enabled && e.quantity > 0)
    .map((e) => ({ type: e.type, quantity: e.quantity }));

  return {
    event_name: form.event.event_name,
    date: iso,
    setup_start_time: padTime(setupStart),
    start_time: padTime(times.start),
    end_time: padTime(times.end),
    room: form.event.room,
    attendee_count: form.event.attendee_count,
    organizer_type: form.event.organizer_type,
    contact: form.contact,
    billing_address: form.billing,
    catering: {
      needed: form.catering.needed,
      before_event: form.catering.before_event,
      during_event: form.catering.during_event,
      after_event: form.catering.after_event,
    },
    setup: {
      seating_type: form.setup.seating_type,
      equipment,
      microphone_needed: form.setup.microphone_needed,
      technical_support_hours: form.setup.technical_support_hours ?? null,
      regie_hours: form.setup.regie_hours ?? null,
    },
    publication: {
      info_screen_text: form.publication.info_screen_text || null,
      publish_on_info_screen: form.publication.publish_on_info_screen,
      publish_target_groups: form.publication.publish_target_groups,
    },
    remarks: form.remarks || null,
    terms_accepted: form.terms_accepted,
  };
}

export type ValidationError = {
  field: string;
  label: string;
  message: string;
};

export type CreateResult =
  | { ok: true; data: Reservation }
  | { ok: false; status: number; message: string; validationErrors?: ValidationError[] };

export async function createReservation(
  payload: ReservationCreate,
): Promise<CreateResult> {
  if (!API_BASE_URL) {
    return { ok: false, status: 0, message: "API nicht konfiguriert" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 201) {
      const data = (await res.json()) as Reservation;
      return { ok: true, data };
    }

    let message = `Fehler ${res.status}`;
    let validationErrors: ValidationError[] | undefined;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body?.detail)) {
        const items = body.detail as Array<{
          field?: string;
          label?: string;
          message?: string;
          msg?: string;
        }>;
        validationErrors = items.map((d) => ({
          field: d.field ?? "",
          label: d.label ?? d.field ?? "",
          message: d.message ?? d.msg ?? "Ungültige Eingabe",
        }));
        message = validationErrors
          .map((e) => (e.label ? `${e.label}: ${e.message}` : e.message))
          .join("; ");
      }
    } catch {
      // ignore body parse failure
    }
    return { ok: false, status: res.status, message, validationErrors };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Netzwerkfehler";
    return { ok: false, status: 0, message };
  }
}

export async function getReservations(roomId: string): Promise<Reservation[]> {
  if (!API_BASE_URL) {
    return [];
  }

  try {
    const res = await fetch(`${API_BASE_URL}/reservations`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    const body = (await res.json()) as { items?: Reservation[] };
    return (body.items ?? []).filter(
      (r) =>
        r.room === roomId &&
        r.status !== "cancelled" &&
        r.status !== "rejected",
    );
  } catch {
    return [];
  }
}

const FULL_DAY_START = "07:00:00";
const FULL_DAY_END = "22:00:00";

function intervalsCoverFullDay(
  intervals: Array<{ start: string; end: string }>,
): boolean {
  if (intervals.length === 0) return false;
  const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start));
  let cursor = FULL_DAY_START;
  for (const { start, end } of sorted) {
    if (start > cursor) return false;
    if (end > cursor) cursor = end;
    if (cursor >= FULL_DAY_END) return true;
  }
  return cursor >= FULL_DAY_END;
}

export function buildAvailability(reservations: Reservation[]): {
  fullyBooked: Set<string>;
  partiallyBooked: Set<string>;
} {
  const byDate = new Map<string, Array<{ start: string; end: string }>>();
  for (const r of reservations) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date)!.push({ start: r.setup_start_time, end: r.end_time });
  }

  const fullyBooked = new Set<string>();
  const partiallyBooked = new Set<string>();
  for (const [date, intervals] of byDate.entries()) {
    if (intervalsCoverFullDay(intervals)) {
      fullyBooked.add(date);
    } else {
      partiallyBooked.add(date);
    }
  }
  return { fullyBooked, partiallyBooked };
}
