"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StaffGuard from "@/components/organisms/staff/StaffGuard";
import {
  clearStaffToken,
  staffDeleteReservation,
  staffGetReservation,
  staffUpdateStatus,
} from "@/lib/staff-api";
import { Reservation, ReservationStatus } from "@/lib/api";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  rejected: "Abgelehnt",
  cancelled: "Storniert",
};

const STATUS_COLORS: Record<ReservationStatus, React.CSSProperties> = {
  pending: { backgroundColor: "#fef3c7", color: "#92400e" },
  confirmed: { backgroundColor: "#d1fae5", color: "#065f46" },
  rejected: { backgroundColor: "#fee2e2", color: "#991b1b" },
  cancelled: { backgroundColor: "#f1f5f9", color: "#475569" },
};

const ROOM_LABELS: Record<string, string> = {
  "seminarraum-5-003-004": "Seminarraum 5-003/004",
  "seminarraum-2-112": "Seminarraum 2-112",
  "aula-1-005": "Aula 1-005",
};

const ORGANIZER_LABELS: Record<string, string> = {
  external_customer: "Externer Kunde",
  public_sector_oda: "Öffentlicher Sektor / ODA",
  cantonal_admin_zug: "Kantonsverwaltung Zug",
  gibz_internal_school_event: "GIBZ intern – Schulanlass",
  gibz_internal_private_event: "GIBZ intern – Privatanlass",
};

const SEATING_LABELS: Record<string, string> = {
  seminar: "Seminar",
  block: "Block",
  theater: "Theater",
  u_shape: "U-Form",
  banquet: "Bankett",
  exam: "Prüfung",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  projector: "Projektor",
  flipchart: "Flipchart",
  pinboard: "Pinnwand",
  visualizer: "Visualizer",
  whiteboard: "Whiteboard",
  laptop: "Laptop",
  lectern: "Rednerpult",
  stage: "Bühne",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white" style={{ border: "1px solid #d6dde5" }}>
      <div
        className="px-4 py-2 text-sm font-bold"
        style={{ backgroundColor: "#eef4fa", borderBottom: "1px solid #d6dde5", color: "#003b73" }}
      >
        {title}
      </div>
      <div className="px-4 py-4 text-sm" style={{ color: "#374151" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1" style={{ borderBottom: "1px solid #f3f4f6" }}>
      <span className="w-40 shrink-0 text-gray-500 text-xs pt-0.5">{label}</span>
      <span className="flex-1 text-sm">{value ?? "–"}</span>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function fmtDateTime(dt: string) {
  return new Date(dt).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReservationDetailPage() {
  return (
    <StaffGuard>
      <DetailContent />
    </StaffGuard>
  );
}

function DetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const result = await staffGetReservation(id);
      setLoading(false);
      if (!result.ok) {
        if (result.status === 401 || result.status === 403) {
          clearStaffToken();
          router.replace("/staff/login");
          return;
        }
        setError(result.message);
        return;
      }
      setReservation(result.data);
    }
    fetch();
  }, [id, router]);

  async function handleStatus(newStatus: ReservationStatus) {
    if (!reservation) return;
    setBusy(true);
    setActionError(null);
    const result = await staffUpdateStatus(reservation.id, newStatus);
    setBusy(false);
    if (!result.ok) {
      setActionError(result.message);
    } else {
      setReservation(result.data);
    }
  }

  async function handleDelete() {
    if (!reservation) return;
    if (!window.confirm("Reservation wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    setBusy(true);
    setActionError(null);
    const result = await staffDeleteReservation(reservation.id);
    setBusy(false);
    if (!result.ok) {
      setActionError(result.message);
    } else {
      router.push("/staff/reservations");
    }
  }

  const btnStyle = (color: string): React.CSSProperties => ({
    border: `1px solid ${color}`,
    backgroundColor: "white",
    color,
    padding: "4px 12px",
    fontSize: "0.8rem",
    cursor: busy ? "not-allowed" : "pointer",
    borderRadius: 0,
    fontFamily: "Arial, sans-serif",
    opacity: busy ? 0.5 : 1,
  });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#eef4fa", fontFamily: "Arial, sans-serif" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: "#003b73" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold text-white px-2 py-1"
            style={{ backgroundColor: "#002550" }}
          >
            GIBZ
          </span>
          <span className="text-white font-medium text-sm">Raumverwaltung</span>
        </div>
        <button
          onClick={() => { clearStaffToken(); router.push("/staff/login"); }}
          className="text-sm text-white underline"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          Abmelden
        </button>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto">
        <Link
          href="/staff/reservations"
          className="text-sm underline mb-4 inline-block"
          style={{ color: "#003b73" }}
        >
          ← Zurück zur Übersicht
        </Link>

        {loading && (
          <p className="text-sm text-gray-500 mt-4">Wird geladen…</p>
        )}

        {error && (
          <p className="text-sm text-red-600 mt-4">{error}</p>
        )}

        {reservation && (
          <>
            {/* Header card */}
            <div
              className="bg-white mb-4 p-4"
              style={{ border: "1px solid #d6dde5" }}
            >
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <div>
                  <h1
                    className="text-lg font-bold mb-1"
                    style={{ color: "#003b73" }}
                  >
                    {reservation.event_name}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {ROOM_LABELS[reservation.room] ?? reservation.room} &middot;{" "}
                    {fmtDate(reservation.date)},{" "}
                    {fmtTime(reservation.start_time)}–{fmtTime(reservation.end_time)} Uhr
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    style={{
                      ...STATUS_COLORS[reservation.status as ReservationStatus],
                      padding: "3px 10px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    {STATUS_LABELS[reservation.status as ReservationStatus]}
                  </span>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {reservation.status === "pending" && (
                      <>
                        <button disabled={busy} style={btnStyle("#065f46")} onClick={() => handleStatus("confirmed")}>
                          Bestätigen
                        </button>
                        <button disabled={busy} style={btnStyle("#991b1b")} onClick={() => handleStatus("rejected")}>
                          Ablehnen
                        </button>
                      </>
                    )}
                    {reservation.status === "confirmed" && (
                      <button disabled={busy} style={btnStyle("#92400e")} onClick={() => handleStatus("cancelled")}>
                        Stornieren
                      </button>
                    )}
                    <button disabled={busy} style={btnStyle("#991b1b")} onClick={handleDelete}>
                      Löschen
                    </button>
                  </div>

                  {actionError && (
                    <p style={{ color: "#991b1b", fontSize: "0.75rem" }}>{actionError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
              {/* Veranstaltung */}
              <Card title="Veranstaltung">
                <Row label="Bezeichnung" value={reservation.event_name} />
                <Row label="Datum" value={fmtDate(reservation.date)} />
                <Row label="Aufbau ab" value={`${fmtTime(reservation.setup_start_time)} Uhr`} />
                <Row label="Beginn" value={`${fmtTime(reservation.start_time)} Uhr`} />
                <Row label="Ende" value={`${fmtTime(reservation.end_time)} Uhr`} />
                <Row label="Raum" value={ROOM_LABELS[reservation.room] ?? reservation.room} />
                <Row label="Teilnehmende" value={reservation.attendee_count} />
                <Row label="Veranstaltertyp" value={ORGANIZER_LABELS[reservation.organizer_type] ?? reservation.organizer_type} />
              </Card>

              {/* Kontakt */}
              <Card title="Kontakt">
                <Row label="Name" value={reservation.contact.name} />
                <Row label="E-Mail" value={reservation.contact.email} />
                <Row label="Telefon" value={reservation.contact.phone} />
                <Row label="Abteilung" value={reservation.contact.department} />
              </Card>

              {/* Rechnungsadresse */}
              <Card title="Rechnungsadresse">
                <Row label="Name" value={reservation.billing_address.name} />
                <Row label="Strasse" value={reservation.billing_address.street} />
                <Row label="PLZ / Ort" value={reservation.billing_address.postal_code_city} />
                <Row label="Rechnungshinweis" value={reservation.billing_address.invoice_note} />
              </Card>

              {/* Einrichtung */}
              <Card title="Einrichtung">
                <Row label="Bestuhlung" value={SEATING_LABELS[reservation.setup.seating_type] ?? reservation.setup.seating_type} />
                <Row
                  label="Equipment"
                  value={
                    reservation.setup.equipment.length > 0
                      ? reservation.setup.equipment
                          .map((e) => `${EQUIPMENT_LABELS[e.type] ?? e.type} ×${e.quantity}`)
                          .join(", ")
                      : "Keines"
                  }
                />
                <Row label="Mikrofon" value={reservation.setup.microphone_needed ? "Ja" : "Nein"} />
                <Row
                  label="Technikstunden"
                  value={
                    reservation.setup.technical_support_hours != null
                      ? `${reservation.setup.technical_support_hours} h`
                      : undefined
                  }
                />
                <Row
                  label="Regiestunden"
                  value={
                    reservation.setup.regie_hours != null
                      ? `${reservation.setup.regie_hours} h`
                      : undefined
                  }
                />
              </Card>

              {/* Catering */}
              <Card title="Catering">
                <Row label="Benötigt" value={reservation.catering.needed ? "Ja" : "Nein"} />
                {reservation.catering.needed && (
                  <>
                    {reservation.catering.before_event.enabled && (
                      <Row
                        label="Vor Veranstaltung"
                        value={`${reservation.catering.before_event.from_time?.slice(0, 5)} – ${reservation.catering.before_event.to_time?.slice(0, 5)}`}
                      />
                    )}
                    {reservation.catering.during_event.enabled && (
                      <Row
                        label="Während Veranstaltung"
                        value={`${reservation.catering.during_event.from_time?.slice(0, 5)} – ${reservation.catering.during_event.to_time?.slice(0, 5)}`}
                      />
                    )}
                    {reservation.catering.after_event.enabled && (
                      <Row
                        label="Nach Veranstaltung"
                        value={`${reservation.catering.after_event.from_time?.slice(0, 5)} – ${reservation.catering.after_event.to_time?.slice(0, 5)}`}
                      />
                    )}
                  </>
                )}
              </Card>

              {/* Sonstiges */}
              <Card title="Sonstiges">
                <Row label="Bemerkungen" value={reservation.remarks} />
                {reservation.publication && (
                  <>
                    <Row
                      label="Infoscreen"
                      value={reservation.publication.publish_on_info_screen ? "Ja" : "Nein"}
                    />
                    <Row label="Infoscreen-Text" value={reservation.publication.info_screen_text} />
                  </>
                )}
                <Row label="Erstellt" value={fmtDateTime(reservation.created_at)} />
                <Row label="Zuletzt geändert" value={fmtDateTime(reservation.updated_at)} />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
