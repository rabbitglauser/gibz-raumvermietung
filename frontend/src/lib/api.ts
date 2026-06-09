export const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : undefined);

export type OrganizerType =
  | "external_customer"
  | "public_sector_oda"
  | "cantonal_admin_zug"
  | "gibz_internal_school_event"
  | "gibz_internal_private_event";

export type SeatingType =
  | "seminar"
  | "block"
  | "theater"
  | "u_shape"
  | "banquet"
  | "exam";

export type EquipmentType =
  | "projector"
  | "flipchart"
  | "pinboard"
  | "visualizer"
  | "whiteboard"
  | "laptop"
  | "lectern"
  | "stage";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled";

export type RoomId =
  | "seminarraum-5-003-004"
  | "seminarraum-2-112"
  | "aula-1-005";

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  department?: string | null;
}

export interface BillingAddress {
  name: string;
  street: string;
  postal_code_city: string;
  invoice_note?: string | null;
}

export interface CateringWindow {
  enabled: boolean;
  from_time?: string | null;
  to_time?: string | null;
}

export interface CateringInfo {
  needed: boolean;
  before_event: CateringWindow;
  during_event: CateringWindow;
  after_event: CateringWindow;
}

export interface EquipmentRequest {
  type: EquipmentType;
  quantity: number;
}

export interface SetupInfo {
  seating_type: SeatingType;
  equipment: EquipmentRequest[];
  microphone_needed: boolean;
  technical_support_hours?: number | null;
  regie_hours?: number | null;
}

export interface PublicationInfo {
  info_screen_text?: string | null;
  publish_on_info_screen: boolean;
  publish_target_groups: string[];
}

export interface ReservationCreate {
  event_name: string;
  date: string;
  setup_start_time: string;
  start_time: string;
  end_time: string;
  room: RoomId;
  attendee_count: number;
  organizer_type: OrganizerType;
  contact: ContactInfo;
  billing_address: BillingAddress;
  catering: CateringInfo;
  setup: SetupInfo;
  publication: PublicationInfo;
  remarks?: string | null;
  terms_accepted: boolean;
}

export interface Reservation extends ReservationCreate {
  id: string;
  status: ReservationStatus;
  // Only present on the create response — used to build the customer edit link.
  edit_token?: string | null;
  reminder_sent_at?: string | null;
  reminder_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  room: RoomId;
  date: string;
  setup_start_time: string;
  end_time: string;
}

export interface RoomContact {
  name: string;
  email: string;
  phone?: string | null;
}

export interface SeatingOption {
  type: string;
  label: string;
  max_people?: number | null;
  max_tables?: number | null;
  recommended_tables?: number | null;
  table_size?: string | null;
  max_chairs_per_table?: number | null;
  recommended_chairs_per_table?: number | null;
  notes: string[];
}

export interface AdditionalMaterial {
  name: string;
  max_quantity?: number | null;
  dimensions?: string | null;
  notes: string[];
}

export interface MicrophoneOption {
  kind: string;
  quantity: number;
}

export interface RoomPrice {
  organizer_type: string;
  label: string;
  half_day_chf?: number | null;
  full_day_chf?: number | null;
  note?: string | null;
}

export interface CateringDetails {
  required: boolean;
  provider: string;
  contact: RoomContact;
  notes: string[];
}

export interface ReservationDetails {
  send_to_email: string;
  catering_send_to_email: string;
  approval_date?: string | null;
  approved_by?: string | null;
}

export interface Room {
  room_id: string;
  sort_order: number;
  name: string;
  room_number: string;
  building: string;
  floor: string;
  area_m2: number;
  location: string;
  description: string;
  image_path?: string | null;
  image_note?: string | null;
  capacity: number;
  seating_types: string[];
  equipment: string[];
  microphone: boolean;
  technical_support: boolean;
  inspection_contact: RoomContact;
  fixed_setup: string[];
  notebook_connections: string[];
  internet_access: string[];
  seating_options: SeatingOption[];
  additional_material: AdditionalMaterial[];
  microphones: MicrophoneOption[];
  microphone_notes: string[];
  pricing: RoomPrice[];
  catering: CateringDetails;
  reservation: ReservationDetails;
  reservation_notes: string[];
  publication_options: string[];
}

export async function getHealth() {
  if (!API_BASE_URL) {
    return { status: "not configured" };
  }

  const res = await fetch(`${API_BASE_URL}/health`, {
    cache: "force-cache",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch backend health: ${res.status}`);
  }

  return res.json();
}

export async function getRooms(): Promise<{ items: Room[] }> {
  if (!API_BASE_URL) {
    return { items: [] };
  }

  const res = await fetch(`${API_BASE_URL}/rooms`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch rooms: ${res.status}`);
  }

  return res.json();
}

export async function getRoom(roomId: string): Promise<Room | null> {
  if (!API_BASE_URL) {
    return null;
  }

  const res = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch room ${roomId}: ${res.status}`);
  }

  return res.json();
}

// --- Public availability (no customer data) -------------------------------

export async function getAvailability(
  roomId?: string,
): Promise<AvailabilitySlot[]> {
  if (!API_BASE_URL) {
    return [];
  }
  const url = new URL(`${API_BASE_URL}/reservations/availability`);
  if (roomId) {
    url.searchParams.set("room", roomId);
  }
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const body = (await res.json()) as { items?: AvailabilitySlot[] };
    return body.items ?? [];
  } catch {
    return [];
  }
}

// --- Customer edit access (token) -----------------------------------------

export async function getReservationByToken(
  token: string,
): Promise<Reservation | null> {
  if (!API_BASE_URL) return null;
  const res = await fetch(`${API_BASE_URL}/reservations/edit/${token}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load reservation: ${res.status}`);
  return res.json();
}

export type UpdateResult =
  | { ok: true; data: Reservation }
  | { ok: false; status: number; message: string };

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) {
      return body.detail
        .map((d: { msg?: string }) => d.msg ?? "Ungültige Eingabe")
        .join("; ");
    }
  } catch {
    // ignore
  }
  return `Fehler ${res.status}`;
}

export async function updateReservationByToken(
  token: string,
  patch: Partial<ReservationCreate>,
): Promise<UpdateResult> {
  if (!API_BASE_URL) {
    return { ok: false, status: 0, message: "API nicht konfiguriert" };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/reservations/edit/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      return { ok: true, data: (await res.json()) as Reservation };
    }
    return { ok: false, status: res.status, message: await parseError(res) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: err instanceof Error ? err.message : "Netzwerkfehler",
    };
  }
}
