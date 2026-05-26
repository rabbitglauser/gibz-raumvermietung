"use client";

import { ReservationFilters } from "@/lib/staff-api";
import { ReservationStatus, RoomId } from "@/lib/api";

const ROOMS: { value: RoomId; label: string }[] = [
  { value: "seminarraum-5-003-004", label: "Seminarraum 5-003/004" },
  { value: "seminarraum-2-112", label: "Seminarraum 2-112" },
  { value: "aula-1-005", label: "Aula 1-005" },
];

const STATUSES: { value: ReservationStatus; label: string }[] = [
  { value: "pending", label: "Ausstehend" },
  { value: "confirmed", label: "Bestätigt" },
  { value: "rejected", label: "Abgelehnt" },
  { value: "cancelled", label: "Storniert" },
];

interface ReservationFiltersBarProps {
  filters: ReservationFilters;
  onChange: (f: ReservationFilters) => void;
}

export default function ReservationFiltersBar({
  filters,
  onChange,
}: ReservationFiltersBarProps) {
  function setUpcoming(value: boolean | undefined) {
    onChange({ ...filters, upcoming: value, date_from: undefined, date_to: undefined });
  }

  const inputStyle: React.CSSProperties = {
    borderRadius: 0,
    border: "1px solid #d6dde5",
    padding: "4px 8px",
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "white",
  };

  function toggleBtn(active: boolean): React.CSSProperties {
    return {
      borderRadius: 0,
      border: `1px solid ${active ? "#003b73" : "#d6dde5"}`,
      backgroundColor: active ? "#003b73" : "white",
      color: active ? "white" : "#374151",
      padding: "4px 12px",
      fontSize: "0.875rem",
      cursor: "pointer",
      fontFamily: "Arial, sans-serif",
    };
  }

  return (
    <div
      className="flex flex-wrap gap-3 items-end p-4"
      style={{ backgroundColor: "#eef4fa", borderBottom: "1px solid #d6dde5" }}
    >
      {/* Zeitraum toggle */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Zeitraum</span>
        <div className="flex">
          <button
            style={toggleBtn(filters.upcoming === undefined)}
            onClick={() => setUpcoming(undefined)}
          >
            Alle
          </button>
          <button
            style={toggleBtn(filters.upcoming === true)}
            onClick={() => setUpcoming(true)}
          >
            Bevorstehend
          </button>
          <button
            style={toggleBtn(filters.upcoming === false)}
            onClick={() => setUpcoming(false)}
          >
            Vergangen
          </button>
        </div>
      </div>

      {/* Von */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Von</label>
        <input
          type="date"
          style={inputStyle}
          value={filters.date_from ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              date_from: e.target.value || undefined,
              upcoming: undefined,
            })
          }
        />
      </div>

      {/* Bis */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Bis</label>
        <input
          type="date"
          style={inputStyle}
          value={filters.date_to ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              date_to: e.target.value || undefined,
              upcoming: undefined,
            })
          }
        />
      </div>

      {/* Raum */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Raum</label>
        <select
          style={inputStyle}
          value={filters.room ?? ""}
          onChange={(e) =>
            onChange({ ...filters, room: e.target.value || undefined })
          }
        >
          <option value="">Alle Räume</option>
          {ROOMS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Status</label>
        <select
          style={inputStyle}
          value={filters.status ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              status: (e.target.value as ReservationStatus) || undefined,
            })
          }
        >
          <option value="">Alle Status</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Catering */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">&nbsp;</span>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.catering === true}
            onChange={(e) =>
              onChange({ ...filters, catering: e.target.checked ? true : undefined })
            }
          />
          Nur mit Catering
        </label>
      </div>

      {/* Reset */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">&nbsp;</span>
        <button
          onClick={() => onChange({})}
          className="text-sm underline"
          style={{ color: "#003b73", background: "none", border: "none", cursor: "pointer", fontFamily: "Arial, sans-serif" }}
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}
