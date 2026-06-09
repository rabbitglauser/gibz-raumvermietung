"use client";

import { useState } from "react";
import Link from "next/link";
import { Reservation, ReservationStatus } from "@/lib/api";
import { staffUpdateStatus, staffDeleteReservation } from "@/lib/staff-api";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  ROOM_LABELS,
  fmtDate,
  fmtTime,
} from "@/lib/staff-utils";

function fmt(date: string, start: string, end: string): string {
  return `${fmtDate(date)}, ${fmtTime(start)}–${fmtTime(end)}`;
}

interface ReservationsTableProps {
  reservations: Reservation[];
  onRefresh: () => void;
}

export default function ReservationsTable({
  reservations,
  onRefresh,
}: ReservationsTableProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleStatus(id: string, newStatus: ReservationStatus) {
    setBusy(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    const result = await staffUpdateStatus(id, newStatus);
    setBusy(null);
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, [id]: result.message }));
    } else {
      onRefresh();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Reservation wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    setBusy(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    const result = await staffDeleteReservation(id);
    setBusy(null);
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, [id]: result.message }));
    } else {
      onRefresh();
    }
  }

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#6b7280",
    borderBottom: "1px solid #d6dde5",
    backgroundColor: "#eef4fa",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "0.8rem",
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "top",
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    border: `1px solid ${color}`,
    backgroundColor: "white",
    color,
    padding: "2px 8px",
    fontSize: "0.75rem",
    cursor: "pointer",
    borderRadius: 0,
    fontFamily: "Arial, sans-serif",
    marginRight: 4,
  });

  if (reservations.length === 0) {
    return (
      <p className="text-sm text-gray-500 px-4 py-6">
        Keine Reservierungen gefunden.
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif" }}>
        <thead>
          <tr>
            <th style={thStyle}>Datum</th>
            <th style={thStyle}>Veranstaltung</th>
            <th style={thStyle}>Raum</th>
            <th style={thStyle}>Kontakt</th>
            <th style={thStyle}>Catering</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => {
            const isBusy = busy === r.id;
            return (
              <tr key={r.id}>
                <td style={tdStyle}>
                  {fmt(r.date, r.start_time, r.end_time)}
                </td>
                <td style={{ ...tdStyle, maxWidth: 200 }}>
                  <span title={r.event_name}>{r.event_name}</span>
                </td>
                <td style={tdStyle}>
                  {ROOM_LABELS[r.room] ?? r.room}
                </td>
                <td style={tdStyle}>
                  <div>{r.contact.name}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                    {r.contact.email}
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  {r.catering.needed ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: "#003b73",
                      }}
                      title="Catering gewünscht"
                    />
                  ) : (
                    <span style={{ color: "#9ca3af" }}>–</span>
                  )}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      ...STATUS_COLORS[r.status as ReservationStatus],
                      padding: "2px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {STATUS_LABELS[r.status as ReservationStatus]}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div className="flex flex-wrap gap-1">
                    <Link
                      href={`/staff/reservations/${r.id}`}
                      style={{
                        ...btnStyle("#003b73"),
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      Detail
                    </Link>

                    {r.status === "pending" && (
                      <>
                        <button
                          disabled={isBusy}
                          style={btnStyle("#065f46")}
                          onClick={() => handleStatus(r.id, "confirmed")}
                        >
                          Bestätigen
                        </button>
                        <button
                          disabled={isBusy}
                          style={btnStyle("#991b1b")}
                          onClick={() => handleStatus(r.id, "rejected")}
                        >
                          Ablehnen
                        </button>
                      </>
                    )}

                    {r.status === "confirmed" && (
                      <button
                        disabled={isBusy}
                        style={btnStyle("#92400e")}
                        onClick={() => handleStatus(r.id, "cancelled")}
                      >
                        Stornieren
                      </button>
                    )}

                    <button
                      disabled={isBusy}
                      style={btnStyle("#991b1b")}
                      onClick={() => handleDelete(r.id)}
                    >
                      Löschen
                    </button>
                  </div>

                  {errors[r.id] && (
                    <p style={{ color: "#991b1b", fontSize: "0.7rem", marginTop: 4 }}>
                      {errors[r.id]}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
