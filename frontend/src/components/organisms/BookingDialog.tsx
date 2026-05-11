"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Room, RoomId } from "@/lib/api";
import {
  type BookingFormValues,
  bookingFormSchema,
  deriveRoomRule,
  toIso,
  validateAgainstRoom,
} from "@/lib/booking-schema";
import { cn } from "@/lib/utils";

import { StepContact } from "./booking/StepContact";
import { StepDates } from "./booking/StepDates";
import { StepEvent } from "./booking/StepEvent";
import { StepExtras } from "./booking/StepExtras";
import { StepReview } from "./booking/StepReview";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
}

const STEPS = [
  { id: 1, label: "Termin" },
  { id: 2, label: "Veranstaltung" },
  { id: 3, label: "Kontakt" },
  { id: 4, label: "Extras" },
  { id: 5, label: "Übersicht" },
] as const;

function defaultValues(room: Room): BookingFormValues {
  return {
    dates: [],
    times: {},
    event: {
      event_name: "",
      room: room.room_id as RoomId,
      attendee_count: 1,
      organizer_type: "external_customer",
      seating_type:
        (room.seating_types[0] as BookingFormValues["event"]["seating_type"]) ??
        "seminar",
      equipment: [],
      microphone_needed: false,
      technical_support_hours: null,
      regie_hours: null,
    },
    contact: {
      name: "",
      email: "",
      phone: "",
      department: "",
    },
    billing: {
      name: "",
      street: "",
      postal_code_city: "",
      invoice_note: "",
    },
    setup: {
      seating_type:
        (room.seating_types[0] as BookingFormValues["setup"]["seating_type"]) ??
        "seminar",
      equipment: [],
      microphone_needed: false,
      technical_support_hours: null,
      regie_hours: null,
    },
    catering: {
      needed: false,
      before_event: { enabled: false, from_time: "", to_time: "" },
      during_event: { enabled: false, from_time: "", to_time: "" },
      after_event: { enabled: false, from_time: "", to_time: "" },
    },
    publication: {
      info_screen_text: "",
      publish_on_info_screen: false,
      publish_target_groups: [],
    },
    remarks: "",
    terms_accepted: false,
  };
}

export function BookingDialog({ open, onOpenChange, room }: BookingDialogProps) {
  const [step, setStep] = useState(1);
  const rule = deriveRoomRule(room);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: defaultValues(room),
    mode: "onTouched",
  });

  function syncSetupSeating(next: BookingFormValues) {
    // Keep event.seating_type and setup.seating_type in sync (we only show one input).
    form.setValue("setup.seating_type", next.setup.seating_type);
  }

  async function handleNext() {
    let valid = true;
    if (step === 1) {
      valid = await form.trigger(["dates", "times"]);
      const dates = form.getValues("dates");
      const times = form.getValues("times");
      const missing = dates.find((d) => !times[toIso(d)]);
      if (missing) valid = false;
    } else if (step === 2) {
      valid = await form.trigger([
        "event.event_name",
        "event.attendee_count",
        "event.organizer_type",
        "setup.seating_type",
        "setup.equipment",
      ]);
      if (valid) {
        const v = form.getValues();
        syncSetupSeating(v);
        const result = validateAgainstRoom(
          { event: v.event, setup: v.setup },
          rule,
        );
        if (!result.ok) {
          for (const [path, msg] of Object.entries(result.errors)) {
            form.setError(path as keyof BookingFormValues, { message: msg });
          }
          valid = false;
        }
      }
    } else if (step === 3) {
      valid = await form.trigger([
        "contact.name",
        "contact.email",
        "contact.phone",
        "billing.name",
        "billing.street",
        "billing.postal_code_city",
      ]);
    } else if (step === 4) {
      valid = await form.trigger([
        "catering",
        "publication",
        "remarks",
        "terms_accepted",
      ]);
    }
    if (valid) setStep((s) => Math.min(5, s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setStep(1);
          form.reset(defaultValues(room));
        }
      }}
    >
      <DialogContent className="max-w-[820px]">
        <DialogHeader>
          <DialogTitle>Reservation {room.name}</DialogTitle>
          <DialogDescription>
            Wähle die gewünschten Termine und fülle die Reservationsdetails aus.
          </DialogDescription>
        </DialogHeader>

        <nav className="flex items-center gap-1 border-b border-[#eceff3] pb-2 text-[11px] font-semibold tracking-[0.06em]">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id < step) setStep(s.id);
              }}
              className={cn(
                "flex items-center gap-1 px-2 py-1",
                s.id === step
                  ? "text-[#003b73]"
                  : s.id < step
                    ? "text-[#5f6872] hover:text-[#003b73]"
                    : "text-[#aab2bd]",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center border text-[10px]",
                  s.id === step
                    ? "border-[#003b73] bg-[#003b73] text-white"
                    : s.id < step
                      ? "border-[#003b73] text-[#003b73]"
                      : "border-[#d6dde5] text-[#aab2bd]",
                )}
              >
                {s.id}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
              {i < STEPS.length - 1 && (
                <span className="ml-1 hidden h-px w-4 bg-[#d6dde5] sm:inline-block" />
              )}
            </button>
          ))}
        </nav>

        <div className="min-h-[360px]">
          {step === 1 && <StepDates form={form} roomId={room.room_id} />}
          {step === 2 && <StepEvent form={form} rule={rule} />}
          {step === 3 && <StepContact form={form} />}
          {step === 4 && (
            <StepExtras
              form={form}
              publicationOptions={room.publication_options}
            />
          )}
          {step === 5 && <StepReview form={form} />}
        </div>

        <div className="flex items-center justify-between border-t border-[#eceff3] pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Zurück
          </Button>
          {step < 5 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#003b73] text-white hover:bg-[#00539b]"
            >
              Weiter
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Schliessen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
