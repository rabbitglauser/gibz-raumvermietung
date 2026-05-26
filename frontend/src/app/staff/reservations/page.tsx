"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffGuard from "@/components/organisms/staff/StaffGuard";
import ReservationFiltersBar from "@/components/organisms/staff/ReservationFiltersBar";
import ReservationsTable from "@/components/organisms/staff/ReservationsTable";
import {
  ReservationFilters,
  clearStaffToken,
  staffListReservations,
} from "@/lib/staff-api";
import { Reservation } from "@/lib/api";

export default function StaffReservationsPage() {
  return (
    <StaffGuard>
      <ReservationsContent />
    </StaffGuard>
  );
}

function ReservationsContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<ReservationFilters>({ upcoming: true });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await staffListReservations(filters);
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

    setReservations(result.data.items);
  }, [filters, router]);

  useEffect(() => {
    load();
  }, [load]);

  function handleLogout() {
    clearStaffToken();
    router.push("/staff/login");
  }

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
          onClick={handleLogout}
          className="text-sm text-white underline"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          Abmelden
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-baseline gap-3 mb-4">
          <h1 className="text-xl font-bold" style={{ color: "#003b73" }}>
            Reservierungen
          </h1>
          {!loading && (
            <span className="text-sm text-gray-500">
              {reservations.length} Einträge
            </span>
          )}
        </div>

        <div className="bg-white" style={{ border: "1px solid #d6dde5" }}>
          <ReservationFiltersBar filters={filters} onChange={setFilters} />

          {loading && (
            <p className="text-sm text-gray-500 px-4 py-6">Wird geladen…</p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-600 px-4 py-6">{error}</p>
          )}

          {!loading && !error && (
            <ReservationsTable reservations={reservations} onRefresh={load} />
          )}
        </div>
      </div>
    </div>
  );
}
