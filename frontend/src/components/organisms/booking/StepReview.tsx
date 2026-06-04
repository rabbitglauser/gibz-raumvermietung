"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  type BookingFormValues,
  ORGANIZER_LABEL,
  SEATING_LABEL,
  toIso,
} from "@/lib/booking-schema";
import {
  buildPayload,
  createReservation,
  type CreateResult,
  type ValidationError,
} from "@/lib/reservations";

type ResultEntry = {
  iso: string;
  date: Date;
  state: "pending" | "ok" | "conflict" | "error";
  message?: string;
  id?: string;
  validationErrors?: ValidationError[];
};

interface StepReviewProps {
  form: UseFormReturn<BookingFormValues>;
}

export function StepReview({ form }: StepReviewProps) {
  const values = form.getValues();
  const sortedDates = [...values.dates].sort(
    (a, b) => a.getTime() - b.getTime(),
  );

  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ResultEntry[]>([]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    const initial: ResultEntry[] = sortedDates.map((d) => ({
      iso: toIso(d),
      date: d,
      state: "pending",
    }));
    setResults(initial);

    const settled = await Promise.all(
      sortedDates.map(async (d): Promise<CreateResult> => {
        return createReservation(buildPayload(values, d));
      }),
    );

    setResults(
      sortedDates.map((d, i) => {
        const r = settled[i];
        if (r.ok) {
          return {
            iso: toIso(d),
            date: d,
            state: "ok",
            id: r.data.id,
            editToken: r.data.edit_token,
          };
        }
        if (r.status === 409) {
          return {
            iso: toIso(d),
            date: d,
            state: "conflict",
            message: r.message,
          };
        }
        return {
          iso: toIso(d),
          date: d,
          state: "error",
          message: r.message,
          validationErrors: r.validationErrors,
        };
      }),
    );

    setSubmitting(false);
  }

  const allDone = results.length > 0 && results.every((r) => r.state !== "pending");
  const allOk = allDone && results.every((r) => r.state === "ok");

  return (
    <div className="grid gap-4">
      <section className="grid gap-2 border border-[#d6dde5] bg-[#f8fafc] p-4">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] text-[#003b73]">
          ZUSAMMENFASSUNG
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[12px] text-[#003b73]">
          <div>
            <Label className="block">VERANSTALTUNG</Label>
            <div>{values.event.event_name}</div>
          </div>
          <div>
            <Label className="block">TEILNEHMENDE</Label>
            <div>{values.event.attendee_count}</div>
          </div>
          <div>
            <Label className="block">VERANSTALTER</Label>
            <div>{ORGANIZER_LABEL[values.event.organizer_type]}</div>
          </div>
          <div>
            <Label className="block">BESTUHLUNG</Label>
            <div>{SEATING_LABEL[values.setup.seating_type]}</div>
          </div>
          <div className="col-span-2">
            <Label className="block">KONTAKT</Label>
            <div>
              {values.contact.name} · {values.contact.email} ·{" "}
              {values.contact.phone}
            </div>
          </div>
        </div>
      </section>

      <section>
        <Label className="mb-2 block">TERMINE</Label>
        <ul className="space-y-2">
          {sortedDates.map((d) => {
            const iso = toIso(d);
            const t = values.times[iso];
            const r = results.find((x) => x.iso === iso);
            return (
              <li
                key={iso}
                className="flex items-center justify-between border border-[#d6dde5] bg-white px-3 py-2 text-[13px] text-[#003b73]"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {format(d, "EEEE, d. MMMM yyyy", { locale: de })}
                  </span>
                  <span className="text-[11px] text-[#5f6872]">
                    {t.setupStart ? `Aufbau ${t.setupStart} · ` : ""}
                    {t.start} – {t.end}
                  </span>
                </div>
                <StatusBadge entry={r} />
              </li>
            );
          })}
        </ul>
      </section>

      {results.some((r) => r.state === "ok" && r.editToken) && (
        <section className="grid gap-2 border border-emerald-200 bg-emerald-50 p-4 text-[12px] text-emerald-900">
          <h3 className="font-semibold tracking-[0.06em]">
            BEARBEITUNGSLINKS
          </h3>
          <p>
            Speichern Sie diese Links, um Catering, Einrichtung und Material
            später (bis einige Tage vor dem Anlass) zu ergänzen:
          </p>
          <ul className="grid gap-1">
            {results
              .filter((r) => r.state === "ok" && r.editToken)
              .map((r) => (
                <li key={r.iso} className="break-all">
                  <span className="font-semibold">
                    {format(r.date, "d. MMM yyyy", { locale: de })}:
                  </span>{" "}
                  <a
                    className="underline"
                    href={`/reservation/edit/?token=${r.editToken}`}
                  >
                    /reservation/edit/?token={r.editToken}
                  </a>
                </li>
              ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-end gap-3">
        {allOk && (
          <span className="text-[12px] text-emerald-700">
            Alle Reservationen erfolgreich angefragt.
          </span>
        )}
        <Button
          type="button"
          onClick={submit}
          disabled={submitting || allOk}
          className="bg-[#003b73] text-white hover:bg-[#00539b]"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Senden…
            </span>
          ) : allOk ? (
            "Gesendet"
          ) : results.length > 0 ? (
            "Erneut senden"
          ) : (
            "Reservation senden"
          )}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ entry }: { entry: ResultEntry | undefined }) {
  if (!entry) {
    return (
      <span className="text-[11px] text-[#5f6872]">bereit zum Senden</span>
    );
  }
  if (entry.state === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[#5f6872]">
        <Loader2 className="size-3 animate-spin" /> wird gesendet…
      </span>
    );
  }
  if (entry.state === "ok") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
        <CheckCircle2 className="size-3" /> erstellt
      </span>
    );
  }
  if (entry.state === "conflict") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
        <AlertCircle className="size-3" />
        Konflikt: {entry.message}
      </span>
    );
  }
  if (entry.validationErrors && entry.validationErrors.length > 0) {
    return (
      <div className="mt-1 flex flex-col gap-0.5">
        {entry.validationErrors.map((e, i) => (
          <span
            key={i}
            className="inline-flex items-start gap-1 text-[11px] text-[#b91c1c]"
          >
            <XCircle className="mt-0.5 size-3 shrink-0" />
            <span>
              <span className="font-medium">{e.label}:</span> {e.message}
            </span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[#b91c1c]">
      <XCircle className="size-3" /> Fehler: {entry.message}
    </span>
  );
}
