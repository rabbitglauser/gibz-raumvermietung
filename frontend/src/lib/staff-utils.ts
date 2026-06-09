import { ReservationStatus } from "./api";

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  rejected: "Abgelehnt",
  cancelled: "Storniert",
};

export const STATUS_COLORS: Record<ReservationStatus, React.CSSProperties> = {
  pending: { backgroundColor: "#fef3c7", color: "#92400e" },
  confirmed: { backgroundColor: "#d1fae5", color: "#065f46" },
  rejected: { backgroundColor: "#fee2e2", color: "#991b1b" },
  cancelled: { backgroundColor: "#f1f5f9", color: "#475569" },
};

export const ROOM_LABELS: Record<string, string> = {
  "seminarraum-5-003-004": "Seminarraum 5-003/004",
  "seminarraum-2-112": "Seminarraum 2-112",
  "aula-1-005": "Aula 1-005",
};

export const ORGANIZER_LABELS: Record<string, string> = {
  external_customer: "Externer Kunde",
  public_sector_oda: "Öffentlicher Sektor / ODA",
  cantonal_admin_zug: "Kantonsverwaltung Zug",
  gibz_internal_school_event: "GIBZ intern – Schulanlass",
  gibz_internal_private_event: "GIBZ intern – Privatanlass",
};

export const SEATING_LABELS: Record<string, string> = {
  seminar: "Seminar",
  block: "Block",
  theater: "Theater",
  u_shape: "U-Form",
  banquet: "Bankett",
  exam: "Prüfung",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  projector: "Projektor",
  flipchart: "Flipchart",
  pinboard: "Pinnwand",
  visualizer: "Visualizer",
  whiteboard: "Whiteboard",
  laptop: "Laptop",
  lectern: "Rednerpult",
  stage: "Bühne",
};

export function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function fmtTime(t: string): string {
  return t.slice(0, 5);
}

export function fmtDateTime(dt: string): string {
  return new Date(dt).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
