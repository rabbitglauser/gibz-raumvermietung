"use client";

import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BookingFormValues } from "@/lib/booking-schema";

interface StepContactProps {
  form: UseFormReturn<BookingFormValues>;
}

const inputClass =
  "h-10 border border-[#d6dde5] bg-white px-3 text-[13px] text-[#003b73] shadow-none focus-visible:ring-[#003b73]";

export function StepContact({ form }: StepContactProps) {
  const errors = form.formState.errors;

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] text-[#003b73]">
          KONTAKT
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <Label className="mb-1 block">NAME</Label>
            <Input
              {...form.register("contact.name")}
              className={inputClass}
            />
            {errors.contact?.name && (
              <p className="mt-1 text-[11px] text-[#b91c1c]">
                {errors.contact.name.message}
              </p>
            )}
          </label>
          <label className="block">
            <Label className="mb-1 block">E-MAIL</Label>
            <Input
              type="email"
              {...form.register("contact.email")}
              className={inputClass}
            />
            {errors.contact?.email && (
              <p className="mt-1 text-[11px] text-[#b91c1c]">
                {errors.contact.email.message}
              </p>
            )}
          </label>
          <label className="block">
            <Label className="mb-1 block">TELEFON</Label>
            <Input
              {...form.register("contact.phone")}
              className={inputClass}
            />
            {errors.contact?.phone && (
              <p className="mt-1 text-[11px] text-[#b91c1c]">
                {errors.contact.phone.message}
              </p>
            )}
          </label>
          <label className="block">
            <Label className="mb-1 block">ABTEILUNG (optional)</Label>
            <Input
              {...form.register("contact.department")}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] text-[#003b73]">
          RECHNUNGSADRESSE
        </h3>
        <div className="grid gap-3">
          <label className="block">
            <Label className="mb-1 block">NAME / FIRMA</Label>
            <Input
              {...form.register("billing.name")}
              className={inputClass}
            />
            {errors.billing?.name && (
              <p className="mt-1 text-[11px] text-[#b91c1c]">
                {errors.billing.name.message}
              </p>
            )}
          </label>
          <label className="block">
            <Label className="mb-1 block">STRASSE</Label>
            <Input
              {...form.register("billing.street")}
              className={inputClass}
            />
            {errors.billing?.street && (
              <p className="mt-1 text-[11px] text-[#b91c1c]">
                {errors.billing.street.message}
              </p>
            )}
          </label>
          <label className="block">
            <Label className="mb-1 block">PLZ / ORT</Label>
            <Input
              {...form.register("billing.postal_code_city")}
              className={inputClass}
            />
            {errors.billing?.postal_code_city && (
              <p className="mt-1 text-[11px] text-[#b91c1c]">
                {errors.billing.postal_code_city.message}
              </p>
            )}
          </label>
          <label className="block">
            <Label className="mb-1 block">VERMERK (optional)</Label>
            <Textarea
              {...form.register("billing.invoice_note")}
              rows={2}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
