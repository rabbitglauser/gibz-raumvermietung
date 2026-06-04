"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { CateringInfo, Reservation, SeatingType } from "@/lib/api";
import {
  getReservationByToken,
  updateReservationByToken,
} from "@/lib/api";
import { SEATING_LABEL } from "@/lib/booking-schema";

type Status = "loading" | "ready" | "notfound" | "saving" | "saved" | "error";

const SEATING_TYPES: SeatingType[] = [
  "seminar",
  "block",
  "theater",
  "u_shape",
  "banquet",
  "exam",
];

function hhmm(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

export default function EditReservation() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");
  const [reservation, setReservation] = useState<Reservation | null>(null);

  // Editable fields
  const [attendees, setAttendees] = useState(0);
  const [seating, setSeating] = useState<SeatingType>("seminar");
  const [microphone, setMicrophone] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [catering, setCatering] = useState<CateringInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getReservationByToken(token)
      .then((r) => {
        if (cancelled) return;
        if (!r) {
          setStatus("notfound");
          return;
        }
        setReservation(r);
        setAttendees(r.attendee_count);
        setSeating(r.setup.seating_type);
        setMicrophone(r.setup.microphone_needed);
        setRemarks(r.remarks ?? "");
        setCatering(r.catering);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [token]);

  function updateWindow(
    key: "before_event" | "during_event" | "after_event",
    patch: Partial<{ enabled: boolean; from_time: string; to_time: string }>,
  ) {
    setCatering((prev) =>
      prev ? { ...prev, [key]: { ...prev[key], ...patch } } : prev,
    );
  }

  async function save() {
    if (!reservation || !catering) return;
    setStatus("saving");
    setMessage("");

    const result = await updateReservationByToken(token, {
      attendee_count: attendees,
      remarks: remarks || null,
      setup: {
        ...reservation.setup,
        seating_type: seating,
        microphone_needed: microphone,
      },
      catering,
    });

    if (result.ok) {
      setReservation(result.data);
      setStatus("saved");
    } else if (result.status === 403) {
      setStatus("error");
      setMessage(
        "Die Bearbeitungsfrist für diese Reservation ist abgelaufen.",
      );
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  }

  if (token && status === "loading") {
    return <p className="text-sm text-slate-500">Reservation wird geladen…</p>;
  }

  if (!token || status === "notfound") {
    return (
      <div className="border border-amber-300 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-lg font-bold">Reservation nicht gefunden</h1>
        <p className="mt-2 text-sm">
          Der Bearbeitungslink ist ungültig oder abgelaufen.
        </p>
      </div>
    );
  }

  if (!reservation || !catering) {
    return (
      <p className="text-sm text-red-600">
        {message || "Es ist ein Fehler aufgetreten."}
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-[#003b73]">
          Reservation ergänzen
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {reservation.event_name} · {reservation.date} ·{" "}
          {hhmm(reservation.start_time)}–{hhmm(reservation.end_time)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
          Status: {reservation.status}
        </p>
      </header>

      {status === "saved" && (
        <div className="border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          Ihre Angaben wurden gespeichert.
        </div>
      )}
      {status === "error" && message && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <Field label="Anzahl Teilnehmende">
        <input
          type="number"
          min={1}
          value={attendees}
          onChange={(e) => setAttendees(Number(e.target.value))}
          className="h-11 w-40 border border-slate-300 bg-slate-50 px-3 outline-none"
        />
      </Field>

      <Field label="Bestuhlung">
        <select
          value={seating}
          onChange={(e) => setSeating(e.target.value as SeatingType)}
          className="h-11 w-full max-w-sm border border-slate-300 bg-slate-50 px-3 outline-none"
        >
          {SEATING_TYPES.map((s) => (
            <option key={s} value={s}>
              {SEATING_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-3 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={microphone}
          onChange={(e) => setMicrophone(e.target.checked)}
          className="size-4"
        />
        Mikrofon benötigt
      </label>

      <fieldset className="grid gap-3 border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-[#003b73]">
          Catering
        </legend>
        <label className="flex items-center gap-3 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={catering.needed}
            onChange={(e) =>
              setCatering({ ...catering, needed: e.target.checked })
            }
            className="size-4"
          />
          Catering benötigt
        </label>

        {catering.needed &&
          (["before_event", "during_event", "after_event"] as const).map(
            (key) => {
              const labels = {
                before_event: "Vor dem Anlass",
                during_event: "Während des Anlasses",
                after_event: "Nach dem Anlass",
              } as const;
              const win = catering[key];
              return (
                <div key={key} className="grid gap-2 border-t border-slate-100 pt-2">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={win.enabled}
                      onChange={(e) =>
                        updateWindow(key, { enabled: e.target.checked })
                      }
                      className="size-4"
                    />
                    {labels[key]}
                  </label>
                  {win.enabled && (
                    <div className="flex items-center gap-3 pl-7 text-sm">
                      <input
                        type="time"
                        value={hhmm(win.from_time)}
                        onChange={(e) =>
                          updateWindow(key, { from_time: e.target.value })
                        }
                        className="h-10 border border-slate-300 bg-slate-50 px-2"
                      />
                      <span>–</span>
                      <input
                        type="time"
                        value={hhmm(win.to_time)}
                        onChange={(e) =>
                          updateWindow(key, { to_time: e.target.value })
                        }
                        className="h-10 border border-slate-300 bg-slate-50 px-2"
                      />
                    </div>
                  )}
                </div>
              );
            },
          )}
      </fieldset>

      <Field label="Bemerkungen">
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          className="w-full border border-slate-300 bg-slate-50 px-3 py-2 outline-none"
        />
      </Field>

      <div>
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="h-12 bg-[#003b73] px-8 font-bold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {status === "saving" ? "Speichern…" : "Änderungen speichern"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
    </div>
  );
}
