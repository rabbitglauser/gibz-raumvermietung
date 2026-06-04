"use client";

import { useEffect, useState } from "react";

import type {
  Reservation,
  ReservationFilters,
  ReservationStatus,
  StaffUser,
} from "@/lib/api";
import {
  deleteReservation,
  getMe,
  listReservations,
  loginStaff,
  logoutStaff,
  updateReservation,
} from "@/lib/api";

const STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
];

function hhmm(value: string): string {
  return value.slice(0, 5);
}

export default function StaffDashboard() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <p className="text-sm text-slate-500">Wird geladen…</p>;
  }

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}

function LoginForm({ onLogin }: { onLogin: (u: StaffUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await loginStaff(username, password);
    setBusy(false);
    if (result.ok) {
      onLogin(result.user);
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-[#003b73]">Mitarbeiter-Login</h1>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-600">Benutzername</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-11 border border-slate-300 bg-slate-50 px-3 outline-none"
            autoComplete="username"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-600">Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 border border-slate-300 bg-slate-50 px-3 outline-none"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-11 bg-[#003b73] font-bold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {busy ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({
  user,
  onLogout,
}: {
  user: StaffUser;
  onLogout: () => void;
}) {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReservationFilters>({});

  useEffect(() => {
    let cancelled = false;
    listReservations(filters).then(({ items }) => {
      if (cancelled) return;
      setItems(items);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  async function changeStatus(id: string, status: ReservationStatus) {
    const result = await updateReservation(id, { status });
    if (result.ok) {
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    }
  }

  async function remove(id: string) {
    const result = await deleteReservation(id);
    if (result.ok) {
      setItems((prev) => prev.filter((r) => r.id !== id));
    } else if (result.status === 403) {
      alert("Nur Administratoren dürfen Reservationen löschen.");
    }
  }

  async function handleLogout() {
    await logoutStaff();
    onLogout();
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003b73]">Reservationen</h1>
          <p className="text-sm text-slate-600">
            Angemeldet als {user.name} ({user.role})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="h-10 border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Abmelden
        </button>
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <p className="text-sm text-slate-500">Wird geladen…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Keine Reservationen gefunden.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Zeit</th>
                <th className="px-3 py-2">Raum</th>
                <th className="px-3 py-2">Veranstaltung</th>
                <th className="px-3 py-2">Kontakt</th>
                <th className="px-3 py-2">Pers.</th>
                <th className="px-3 py-2">Catering</th>
                <th className="px-3 py-2">Status</th>
                {isAdmin && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {hhmm(r.start_time)}–{hhmm(r.end_time)}
                  </td>
                  <td className="px-3 py-2">{r.room}</td>
                  <td className="px-3 py-2">{r.event_name}</td>
                  <td className="px-3 py-2">
                    <div>{r.contact.name}</div>
                    <div className="text-xs text-slate-500">
                      {r.contact.email}
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.attendee_count}</td>
                  <td className="px-3 py-2">
                    {r.catering.needed ? "Ja" : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        changeStatus(r.id, e.target.value as ReservationStatus)
                      }
                      className="border border-slate-300 bg-white px-2 py-1 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2">
                      <button
                        onClick={() => remove(r.id)}
                        className="text-sm font-semibold text-red-600 hover:underline"
                      >
                        Löschen
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: ReservationFilters;
  onChange: (f: ReservationFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 border border-slate-200 bg-slate-50 p-4">
      <label className="grid gap-1 text-xs">
        <span className="font-semibold uppercase text-slate-500">Suche</span>
        <input
          value={filters.q ?? ""}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Name, Raum, Veranstaltung"
          className="h-9 w-56 border border-slate-300 bg-white px-2"
        />
      </label>
      <label className="grid gap-1 text-xs">
        <span className="font-semibold uppercase text-slate-500">Von</span>
        <input
          type="date"
          value={filters.date_from ?? ""}
          onChange={(e) => onChange({ ...filters, date_from: e.target.value })}
          className="h-9 border border-slate-300 bg-white px-2"
        />
      </label>
      <label className="grid gap-1 text-xs">
        <span className="font-semibold uppercase text-slate-500">Bis</span>
        <input
          type="date"
          value={filters.date_to ?? ""}
          onChange={(e) => onChange({ ...filters, date_to: e.target.value })}
          className="h-9 border border-slate-300 bg-white px-2"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.has_catering ?? false}
          onChange={(e) =>
            onChange({
              ...filters,
              has_catering: e.target.checked ? true : undefined,
            })
          }
          className="size-4"
        />
        Mit Catering
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.upcoming ?? false}
          onChange={(e) =>
            onChange({
              ...filters,
              upcoming: e.target.checked ? true : undefined,
              past: undefined,
            })
          }
          className="size-4"
        />
        Anstehend
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.past ?? false}
          onChange={(e) =>
            onChange({
              ...filters,
              past: e.target.checked ? true : undefined,
              upcoming: undefined,
            })
          }
          className="size-4"
        />
        Vergangen
      </label>
      <button
        onClick={() => onChange({})}
        className="h-9 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        Zurücksetzen
      </button>
    </div>
  );
}
