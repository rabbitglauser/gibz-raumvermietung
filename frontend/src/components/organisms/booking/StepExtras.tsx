"use client";

import type { UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BookingFormValues } from "@/lib/booking-schema";
import { cn } from "@/lib/utils";

interface StepExtrasProps {
  form: UseFormReturn<BookingFormValues>;
  publicationOptions: string[];
}

const WINDOWS: Array<{
  key: "before_event" | "during_event" | "after_event";
  label: string;
}> = [
  { key: "before_event", label: "Vor der Veranstaltung" },
  { key: "during_event", label: "Während der Veranstaltung" },
  { key: "after_event", label: "Nach der Veranstaltung" },
];

const inputClass =
  "h-9 border border-[#d6dde5] bg-white px-2 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]";

export function StepExtras({ form, publicationOptions }: StepExtrasProps) {
  const errors = form.formState.errors;
  const cateringNeeded = form.watch("catering.needed");
  const publishOn = form.watch("publication.publish_on_info_screen");
  const targetGroups = form.watch("publication.publish_target_groups");

  function toggleGroup(group: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...(targetGroups ?? []), group]))
      : (targetGroups ?? []).filter((g) => g !== group);
    form.setValue("publication.publish_target_groups", next, {
      shouldValidate: true,
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold tracking-[0.06em] text-[#003b73]">
            VERPFLEGUNG
          </h3>
          <label className="flex items-center gap-2 text-[12px] text-[#003b73]">
            <Checkbox
              checked={cateringNeeded}
              onCheckedChange={(c) =>
                form.setValue("catering.needed", c === true, {
                  shouldValidate: true,
                })
              }
            />
            Verpflegung gewünscht
          </label>
        </div>
        {cateringNeeded && (
          <ul className="space-y-2">
            {WINDOWS.map(({ key, label }) => {
              const enabled = form.watch(`catering.${key}.enabled`);
              const winErr = errors.catering?.[key];
              return (
                <li
                  key={key}
                  className="border border-[#d6dde5] bg-white p-3"
                >
                  <label className="flex items-center gap-2 text-[13px] text-[#003b73]">
                    <Checkbox
                      checked={enabled}
                      onCheckedChange={(c) =>
                        form.setValue(`catering.${key}.enabled`, c === true, {
                          shouldValidate: true,
                        })
                      }
                    />
                    {label}
                  </label>
                  {enabled && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="block">
                        <Label className="mb-1 block">VON</Label>
                        <Input
                          type="time"
                          {...form.register(`catering.${key}.from_time`)}
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <Label className="mb-1 block">BIS</Label>
                        <Input
                          type="time"
                          {...form.register(`catering.${key}.to_time`)}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  )}
                  {winErr && (
                    <p className="mt-1 text-[11px] text-[#b91c1c]">
                      {winErr.to_time?.message ||
                        winErr.from_time?.message ||
                        winErr.message}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {errors.catering?.needed && (
          <p className="text-[11px] text-[#b91c1c]">
            {errors.catering.needed.message}
          </p>
        )}
      </section>

      <section className="grid gap-3">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] text-[#003b73]">
          PUBLIKATION
        </h3>
        <label className="flex items-center gap-2 text-[13px] text-[#003b73]">
          <Checkbox
            checked={publishOn}
            onCheckedChange={(c) =>
              form.setValue("publication.publish_on_info_screen", c === true, {
                shouldValidate: true,
              })
            }
          />
          Auf Info-Bildschirm publizieren
        </label>
        {publishOn && (
          <>
            <label className="block">
              <Label className="mb-1 block">TEXT AUF INFO-BILDSCHIRM</Label>
              <Textarea
                {...form.register("publication.info_screen_text")}
                rows={2}
              />
            </label>
            {publicationOptions.length > 0 && (
              <div>
                <Label className="mb-1 block">ZIELGRUPPEN</Label>
                <ul className="grid grid-cols-2 gap-2">
                  {publicationOptions.map((g) => {
                    const checked = (targetGroups ?? []).includes(g);
                    return (
                      <li key={g}>
                        <label
                          className={cn(
                            "flex items-center gap-2 border border-[#d6dde5] bg-white px-3 py-2 text-[13px] text-[#003b73]",
                            checked && "border-[#003b73]",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              toggleGroup(g, c === true)
                            }
                          />
                          {g}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <section className="grid gap-3">
        <label className="block">
          <Label className="mb-1 block">BEMERKUNGEN</Label>
          <Textarea {...form.register("remarks")} rows={3} />
        </label>
      </section>

      <section>
        <label className="flex items-start gap-2 text-[12px] leading-relaxed text-[#003b73]">
          <Checkbox
            checked={form.watch("terms_accepted")}
            onCheckedChange={(c) =>
              form.setValue("terms_accepted", c === true, {
                shouldValidate: true,
              })
            }
            className="mt-0.5"
          />
          <span>
            Ich akzeptiere die Reservationsbedingungen und bestätige, dass die
            Angaben korrekt sind.
          </span>
        </label>
        {errors.terms_accepted && (
          <p className="mt-1 text-[11px] text-[#b91c1c]">
            {errors.terms_accepted.message}
          </p>
        )}
      </section>
    </div>
  );
}
