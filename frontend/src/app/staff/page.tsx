"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { Button } from "@/components/ui/button";
import type { Reservation, ReservationStatus } from "@/lib/api";
import {
  cancelReservation,
  getCurrentStaff,
  listStaffReservations,
  loginStaff,
  logoutStaff,
  runReminders,
  updateReservationStatus,
  type ReminderRunResult,
  type StaffUser,
} from "@/lib/staff";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Offen",
  confirmed: "Bestätigt",
  rejected: "Abgelehnt",
  cancelled: "Annulliert",
};

const STATUS_CLASS: Record<ReservationStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
};

type PeriodFilter = "all" | "upcoming" | "past";
type CateringFilter = "all" | "true" | "false";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function LoginPanel({
  onLogin,
}: {
  onLogin: (staff: StaffUser) => void | Promise<void>;
}) {
  const [username, setUsername] = useState("secretariat");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await loginStaff(username, password);
    setLoading(false);
    if (result.ok) {
      await onLogin(result.data);
    } else {
      setError(result.message);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[520px] flex-1 px-4 py-12">
      <form
        onSubmit={submit}
        className="border border-[#d6dde5] bg-white p-6 shadow-sm"
      >
        <div className="text-[11px] font-semibold tracking-[0.12em] text-[#00539b]">
          MITARBEITENDE
        </div>
        <h1 className="mt-2 text-[28px] font-bold leading-tight text-[#003b73]">
          Staff Login
        </h1>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-[#5f6872]">
              Benutzername
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-11 border border-[#d6dde5] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#003b73]"
              autoComplete="username"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-[#5f6872]">
              Passwort
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 border border-[#d6dde5] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#003b73]"
              autoComplete="current-password"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-[#003b73] text-white hover:bg-[#00539b]"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Anmelden
        </Button>
      </form>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#d6dde5] bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f6872]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-[#003b73]">{value}</div>
    </div>
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [catering, setCatering] = useState<CateringFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("upcoming");
  const [reminderResult, setReminderResult] = useState<ReminderRunResult | null>(
    null,
  );

  const filters = useMemo(
    () => ({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      has_catering:
        catering === "all" ? undefined : catering === "true" ? true : false,
      upcoming: period === "upcoming" ? true : undefined,
      past: period === "past" ? true : undefined,
    }),
    [catering, fromDate, period, toDate],
  );

  async function loadReservations() {
    setLoading(true);
    setError(null);
    const result = await listStaffReservations(filters);
    setLoading(false);
    if (result.ok) {
      setReservations(result.data);
    } else {
      setError(result.message);
    }
  }

  useEffect(() => {
    async function loadSession() {
      const current = await getCurrentStaff();
      setStaff(current);
      setLoadingSession(false);
      if (current) {
        await loadReservations();
      }
    }
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    return {
      pending: reservations.filter((item) => item.status === "pending").length,
      confirmed: reservations.filter((item) => item.status === "confirmed")
        .length,
      rejected: reservations.filter((item) => item.status === "rejected").length,
      cancelled: reservations.filter((item) => item.status === "cancelled")
        .length,
      catering: reservations.filter((item) => item.catering?.needed).length,
    };
  }, [reservations]);

  async function handleStatus(id: string, status: ReservationStatus) {
    setMessage(null);
    setError(null);
    const result = await updateReservationStatus(id, status);
    if (result.ok) {
      setMessage(`Status geändert: ${STATUS_LABEL[status]}`);
      await loadReservations();
    } else {
      setError(result.message);
    }
  }

  async function handleCancel(id: string) {
    setMessage(null);
    setError(null);
    const result = await cancelReservation(id);
    if (result.ok) {
      setMessage("Reservation annulliert");
      await loadReservations();
    } else {
      setError(result.message);
    }
  }

  async function handleLogout() {
    await logoutStaff();
    setStaff(null);
    setReservations([]);
  }

  async function handleLoggedIn(current: StaffUser) {
    setStaff(current);
    await loadReservations();
  }

  async function handleReminderRun() {
    setMessage(null);
    setError(null);
    setReminderResult(null);
    const result = await runReminders();
    if (result.ok) {
      setReminderResult(result.data);
      setMessage(`${result.data.sent} Erinnerung(en) gesendet`);
    } else {
      setError(result.message);
    }
  }

  if (loadingSession) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#003b73]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <LoginPanel onLogin={handleLoggedIn} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-4 border-b border-[#d6dde5] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.12em] text-[#00539b]">
              MITARBEITENDE
            </div>
            <h1 className="mt-2 text-[32px] font-bold leading-tight text-[#003b73]">
              Reservationsverwaltung
            </h1>
            <p className="mt-2 text-sm text-[#5f6872]">
              {staff.username} · {staff.role}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReminderRun}
              className="border-[#003b73] text-[#003b73]"
            >
              <Mail className="size-4" />
              Erinnerungen
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="border-[#d6dde5]"
            >
              <LogOut className="size-4" />
              Abmelden
            </Button>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatBox label="Offen" value={stats.pending} />
          <StatBox label="Bestätigt" value={stats.confirmed} />
          <StatBox label="Abgelehnt" value={stats.rejected} />
          <StatBox label="Annulliert" value={stats.cancelled} />
          <StatBox label="Verpflegung" value={stats.catering} />
        </section>

        <section className="mt-6 border border-[#d6dde5] bg-[#f8fafc] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
            <label className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f6872]">
                Von
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-10 border border-[#d6dde5] bg-white px-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f6872]">
                Bis
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-10 border border-[#d6dde5] bg-white px-2 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f6872]">
                Verpflegung
              </span>
              <select
                value={catering}
                onChange={(event) =>
                  setCatering(event.target.value as CateringFilter)
                }
                className="h-10 border border-[#d6dde5] bg-white px-2 text-sm"
              >
                <option value="all">Alle</option>
                <option value="true">Mit Verpflegung</option>
                <option value="false">Ohne Verpflegung</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f6872]">
                Zeitraum
              </span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
                className="h-10 border border-[#d6dde5] bg-white px-2 text-sm"
              >
                <option value="all">Alle</option>
                <option value="upcoming">Kommend</option>
                <option value="past">Vergangen</option>
              </select>
            </label>
            <Button
              type="button"
              onClick={loadReservations}
              disabled={loading}
              className="h-10 bg-[#003b73] text-white hover:bg-[#00539b]"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Filtern
            </Button>
          </div>
        </section>

        {(message || error || reminderResult) && (
          <section className="mt-4 grid gap-2">
            {message && (
              <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <CheckCircle2 className="size-4" />
                {message}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                <XCircle className="size-4" />
                {error}
              </div>
            )}
            {reminderResult && (
              <div className="border border-[#d6dde5] bg-white px-3 py-2 text-sm text-[#003b73]">
                Geprüft: {reminderResult.checked} · Gesendet:{" "}
                {reminderResult.sent} · Übersprungen: {reminderResult.skipped}
                {reminderResult.errors.length > 0 && (
                  <div className="mt-1 text-red-700">
                    {reminderResult.errors.join("; ")}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="mt-6 overflow-x-auto border border-[#d6dde5]">
          <table className="min-w-[980px] w-full border-collapse bg-white text-left text-sm">
            <thead className="bg-[#eef4fa] text-[11px] uppercase tracking-[0.08em] text-[#003b73]">
              <tr>
                <th className="px-3 py-3">Anlass</th>
                <th className="px-3 py-3">Termin</th>
                <th className="px-3 py-3">Raum</th>
                <th className="px-3 py-3">Kontakt</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-t border-[#d6dde5]">
                  <td className="px-3 py-3 align-top">
                    <div className="font-semibold text-[#003b73]">
                      {reservation.event_name}
                    </div>
                    <div className="mt-1 text-xs text-[#5f6872]">
                      {reservation.attendee_count} Personen
                      {reservation.catering?.needed ? " · Verpflegung" : ""}
                    </div>
                    {reservation.reminder_sent_at && (
                      <div className="mt-1 text-xs text-emerald-700">
                        Erinnerung gesendet
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div>{formatDate(reservation.date)}</div>
                    <div className="text-xs text-[#5f6872]">
                      {formatTime(reservation.setup_start_time)} /{" "}
                      {formatTime(reservation.start_time)}-
                      {formatTime(reservation.end_time)}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">{reservation.room}</td>
                  <td className="px-3 py-3 align-top">
                    <div>{reservation.contact.name}</div>
                    <a
                      href={`mailto:${reservation.contact.email}`}
                      className="text-xs text-[#00539b] underline underline-offset-2"
                    >
                      {reservation.contact.email}
                    </a>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span
                      className={`inline-flex border px-2 py-1 text-xs font-semibold ${STATUS_CLASS[reservation.status]}`}
                    >
                      {STATUS_LABEL[reservation.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatus(reservation.id, "confirmed")}
                      >
                        <CheckCircle2 className="size-3" />
                        Bestätigen
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatus(reservation.id, "rejected")}
                      >
                        <XCircle className="size-3" />
                        Ablehnen
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(reservation.id)}
                      >
                        Annullieren
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center text-sm text-[#5f6872]"
                  >
                    Keine Reservationen gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={loadReservations}
            disabled={loading}
          >
            <RefreshCw className="size-4" />
            Aktualisieren
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
