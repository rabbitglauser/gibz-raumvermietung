"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AvailabilitySlot } from "@/lib/api";
import {
  type BookingFormValues,
  toIso,
} from "@/lib/booking-schema";
import { buildAvailability, getAvailability } from "@/lib/reservations";
import { cn } from "@/lib/utils";

interface StepDatesProps {
  form: UseFormReturn<BookingFormValues>;
  roomId: string;
}

const DEFAULT_START = "08:00";
const DEFAULT_END = "17:00";

export function StepDates({ form, roomId }: StepDatesProps) {
  const [reservations, setReservations] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  const dates = form.watch("dates");
  const times = form.watch("times");

  useEffect(() => {
    let cancelled = false;
    getAvailability(roomId)
      .then((items) => {
        if (!cancelled) setReservations(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const availability = useMemo(
    () => buildAvailability(reservations),
    [reservations],
  );

  const disabledDates = useMemo(
    () =>
      Array.from(availability.fullyBooked).map((iso) => {
        const [y, m, d] = iso.split("-").map(Number);
        return new Date(y, m - 1, d);
      }),
    [availability.fullyBooked],
  );

  const partiallyBookedDates = useMemo(
    () =>
      Array.from(availability.partiallyBooked).map((iso) => {
        const [y, m, d] = iso.split("-").map(Number);
        return new Date(y, m - 1, d);
      }),
    [availability.partiallyBooked],
  );

  function handleSelect(next: Date[] | undefined) {
    const nextDates = next ?? [];
    const nextIsos = new Set(nextDates.map(toIso));
    const nextTimes: BookingFormValues["times"] = {};
    for (const d of nextDates) {
      const iso = toIso(d);
      nextTimes[iso] = times[iso] ?? {
        setupStart: "",
        start: DEFAULT_START,
        end: DEFAULT_END,
      };
    }
    for (const iso of Object.keys(times)) {
      if (!nextIsos.has(iso)) continue;
      nextTimes[iso] = times[iso];
    }
    form.setValue("dates", nextDates, { shouldValidate: true });
    form.setValue("times", nextTimes, { shouldValidate: true });
  }

  function removeDate(iso: string) {
    const remaining = dates.filter((d) => toIso(d) !== iso);
    const nextTimes = { ...times };
    delete nextTimes[iso];
    form.setValue("dates", remaining, { shouldValidate: true });
    form.setValue("times", nextTimes, { shouldValidate: true });
  }

  function updateTime(
    iso: string,
    field: "setupStart" | "start" | "end",
    value: string,
  ) {
    const current = times[iso] ?? {
      setupStart: "",
      start: DEFAULT_START,
      end: DEFAULT_END,
    };
    form.setValue(
      "times",
      { ...times, [iso]: { ...current, [field]: value } },
      { shouldValidate: true },
    );
  }

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const datesError = form.formState.errors.dates?.message;
  const timesErrors = form.formState.errors.times as
    | Record<string, { setupStart?: { message?: string }; start?: { message?: string }; end?: { message?: string }; message?: string }>
    | undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div>
        <Label className="mb-2 block">TERMINE</Label>
        <div className="border border-[#d6dde5] bg-white">
          <Calendar
            mode="multiple"
            selected={dates}
            onSelect={handleSelect}
            disabled={[{ before: new Date() }, ...disabledDates]}
            modifiers={{ partiallyBooked: partiallyBookedDates }}
            modifiersClassNames={{
              partiallyBooked:
                "after:absolute after:left-1/2 after:bottom-1 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-amber-500",
            }}
            weekStartsOn={1}
            locale={de}
            numberOfMonths={1}
          />
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-[#5f6872]">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#003b73]" /> ausgewählt
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" /> teilweise belegt
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#d6dde5]" /> ausgebucht
          </span>
        </div>
        {loading && (
          <p className="mt-2 text-[11px] text-[#5f6872]">
            Verfügbarkeit wird geladen…
          </p>
        )}
      </div>

      <div className="min-w-0">
        <Label className="mb-2 block">ZEITEN PRO DATUM</Label>
        {datesError && (
          <p className="mb-2 text-[12px] text-[#b91c1c]">{String(datesError)}</p>
        )}
        {sortedDates.length === 0 ? (
          <div className="flex h-32 items-center justify-center border border-dashed border-[#d6dde5] text-[12px] text-[#5f6872]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              Wähle ein oder mehrere Daten im Kalender
            </span>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedDates.map((d) => {
              const iso = toIso(d);
              const entry = times[iso] ?? {
                setupStart: "",
                start: DEFAULT_START,
                end: DEFAULT_END,
              };
              const err = timesErrors?.[iso];
              return (
                <li
                  key={iso}
                  className="border border-[#d6dde5] bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#003b73]">
                      {format(d, "EEEE, d. MMMM yyyy", { locale: de })}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDate(iso)}
                      className="text-[#5f6872] hover:text-[#b91c1c] focus:outline-none focus:ring-1 focus:ring-[#003b73]"
                      aria-label="Datum entfernen"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <label className="block">
                      <Label className="mb-1 block">AUFBAU</Label>
                      <Input
                        type="time"
                        value={entry.setupStart ?? ""}
                        onChange={(e) =>
                          updateTime(iso, "setupStart", e.target.value)
                        }
                        className={cn(
                          "h-9 border border-[#d6dde5] bg-white px-2 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]",
                          err?.setupStart && "border-[#b91c1c]",
                        )}
                      />
                    </label>
                    <label className="block">
                      <Label className="mb-1 block">VON</Label>
                      <Input
                        type="time"
                        value={entry.start}
                        onChange={(e) =>
                          updateTime(iso, "start", e.target.value)
                        }
                        className={cn(
                          "h-9 border border-[#d6dde5] bg-white px-2 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]",
                          err?.start && "border-[#b91c1c]",
                        )}
                      />
                    </label>
                    <label className="block">
                      <Label className="mb-1 block">BIS</Label>
                      <Input
                        type="time"
                        value={entry.end}
                        onChange={(e) =>
                          updateTime(iso, "end", e.target.value)
                        }
                        className={cn(
                          "h-9 border border-[#d6dde5] bg-white px-2 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]",
                          err?.end && "border-[#b91c1c]",
                        )}
                      />
                    </label>
                  </div>
                  {err && (
                    <p className="mt-1 text-[11px] text-[#b91c1c]">
                      {err.end?.message ||
                        err.setupStart?.message ||
                        err.start?.message ||
                        err.message}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
