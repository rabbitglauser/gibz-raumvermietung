"use client";

import type { UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EquipmentType, OrganizerType, SeatingType } from "@/lib/api";
import {
  type BookingFormValues,
  EQUIPMENT_LABEL,
  ORGANIZER_LABEL,
  type RoomRule,
  SEATING_LABEL,
} from "@/lib/booking-schema";
import { cn } from "@/lib/utils";

interface StepEventProps {
  form: UseFormReturn<BookingFormValues>;
  rule: RoomRule;
}

const ORGANIZER_OPTIONS: OrganizerType[] = [
  "external_customer",
  "public_sector_oda",
  "cantonal_admin_zug",
  "gibz_internal_school_event",
  "gibz_internal_private_event",
];

const ALL_EQUIPMENT: EquipmentType[] = [
  "projector",
  "flipchart",
  "pinboard",
  "visualizer",
  "whiteboard",
  "laptop",
  "lectern",
  "stage",
];

export function StepEvent({ form, rule }: StepEventProps) {
  const errors = form.formState.errors;
  const equipment = form.watch("setup.equipment");
  const seatingOptions = (rule.allowed_seating ?? []) as SeatingType[];

  function toggleEquipment(type: EquipmentType, enabled: boolean) {
    const next = ALL_EQUIPMENT.filter((t) => rule.allowed_equipment.includes(t)).map(
      (t) => {
        const existing = equipment.find((e) => e.type === t);
        if (t === type) {
          return {
            type: t,
            enabled,
            quantity: existing?.quantity ?? 1,
          };
        }
        return (
          existing ?? { type: t, enabled: false, quantity: 1 }
        );
      },
    );
    form.setValue("setup.equipment", next, { shouldValidate: true });
  }

  function setQuantity(type: EquipmentType, quantity: number) {
    const next = equipment.map((e) =>
      e.type === type ? { ...e, quantity: Math.max(1, quantity) } : e,
    );
    form.setValue("setup.equipment", next, { shouldValidate: true });
  }

  return (
    <div className="grid gap-4">
      <label className="block">
        <Label className="mb-1 block">VERANSTALTUNGSNAME</Label>
        <Input
          type="text"
          {...form.register("event.event_name")}
          className="h-10 border border-[#d6dde5] bg-white px-3 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]"
        />
        {errors.event?.event_name && (
          <p className="mt-1 text-[11px] text-[#b91c1c]">
            {errors.event.event_name.message}
          </p>
        )}
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <Label className="mb-1 block">
            TEILNEHMENDE (max. {rule.capacity})
          </Label>
          <Input
            type="number"
            min={1}
            max={rule.capacity}
            {...form.register("event.attendee_count", { valueAsNumber: true })}
            className="h-10 border border-[#d6dde5] bg-white px-3 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]"
          />
          {errors.event?.attendee_count && (
            <p className="mt-1 text-[11px] text-[#b91c1c]">
              {errors.event.attendee_count.message}
            </p>
          )}
        </label>

        <div>
          <Label className="mb-1 block">VERANSTALTERTYP</Label>
          <Select
            value={form.watch("event.organizer_type")}
            onValueChange={(v) =>
              form.setValue("event.organizer_type", v as OrganizerType, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Bitte wählen" />
            </SelectTrigger>
            <SelectContent>
              {ORGANIZER_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {ORGANIZER_LABEL[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-1 block">BESTUHLUNG</Label>
        <Select
          value={form.watch("setup.seating_type")}
          onValueChange={(v) =>
            form.setValue("setup.seating_type", v as SeatingType, {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Bitte wählen" />
          </SelectTrigger>
          <SelectContent>
            {seatingOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {SEATING_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1 block">ZUSATZMATERIAL</Label>
        {rule.allowed_equipment.length === 0 ? (
          <p className="text-[12px] text-[#5f6872]">
            Kein Zusatzmaterial verfügbar.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {rule.allowed_equipment.map((type) => {
              const eq = equipment.find((e) => e.type === type);
              const enabled = !!eq?.enabled;
              return (
                <li
                  key={type}
                  className={cn(
                    "flex items-center justify-between gap-2 border border-[#d6dde5] bg-white px-3 py-2",
                    enabled && "border-[#003b73]",
                  )}
                >
                  <label className="flex items-center gap-2 text-[13px] text-[#003b73]">
                    <Checkbox
                      checked={enabled}
                      onCheckedChange={(c) =>
                        toggleEquipment(type, c === true)
                      }
                    />
                    {EQUIPMENT_LABEL[type]}
                  </label>
                  {enabled && (
                    <Input
                      type="number"
                      min={1}
                      value={eq?.quantity ?? 1}
                      onChange={(e) =>
                        setQuantity(type, Number(e.target.value || 1))
                      }
                      className="h-8 w-16 border border-[#d6dde5] bg-white px-2 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {rule.microphone_available && (
          <label className="flex items-center gap-2 text-[13px] text-[#003b73]">
            <Checkbox
              checked={form.watch("setup.microphone_needed")}
              onCheckedChange={(c) =>
                form.setValue("setup.microphone_needed", c === true, {
                  shouldValidate: true,
                })
              }
            />
            Mikrofonanlage gewünscht
          </label>
        )}
        {rule.technical_support_available && (
          <label className="block">
            <Label className="mb-1 block">TECHN. SUPPORT (Std.)</Label>
            <Input
              type="number"
              min={0}
              step="0.5"
              {...form.register("setup.technical_support_hours", {
                valueAsNumber: true,
              })}
              className="h-10 border border-[#d6dde5] bg-white px-3 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]"
            />
          </label>
        )}
        {rule.regie_available && (
          <label className="block">
            <Label className="mb-1 block">REGIE (Std.)</Label>
            <Input
              type="number"
              min={0}
              step="0.5"
              {...form.register("setup.regie_hours", {
                valueAsNumber: true,
              })}
              className="h-10 border border-[#d6dde5] bg-white px-3 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]"
            />
          </label>
        )}
      </div>
    </div>
  );
}
