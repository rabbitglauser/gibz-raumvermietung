"use client";

import { FormEvent, useState } from "react";
import type { Reservation, ReservationCreate } from "@/lib/api";
import { updateReservation } from "@/lib/reservations";

interface Props {
  token: string;
  reservation: Reservation;
}

export default function ReservationEditForm({ token, reservation }: Props) {
  const [eventName, setEventName] = useState(reservation.event_name);
  const [attendeeCount, setAttendeeCount] = useState(
    String(reservation.attendee_count),
  );
  const [setupStart, setSetupStart] = useState(
    reservation.setup_start_time.slice(0, 5),
  );
  const [startTime, setStartTime] = useState(
    reservation.start_time.slice(0, 5),
  );
  const [endTime, setEndTime] = useState(reservation.end_time.slice(0, 5));
  const [contactName, setContactName] = useState(reservation.contact.name);
  const [contactEmail, setContactEmail] = useState(reservation.contact.email);
  const [contactPhone, setContactPhone] = useState(reservation.contact.phone);
  const [contactDept, setContactDept] = useState(
    reservation.contact.department ?? "",
  );
  const [billingName, setBillingName] = useState(
    reservation.billing_address.name,
  );
  const [billingStreet, setBillingStreet] = useState(
    reservation.billing_address.street,
  );
  const [billingCity, setBillingCity] = useState(
    reservation.billing_address.postal_code_city,
  );
  const [billingNote, setBillingNote] = useState(
    reservation.billing_address.invoice_note ?? "",
  );
  const [remarks, setRemarks] = useState(reservation.remarks ?? "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: ReservationCreate = {
      event_name: eventName,
      date: reservation.date,
      setup_start_time: setupStart.length === 5 ? `${setupStart}:00` : setupStart,
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      room: reservation.room,
      attendee_count: parseInt(attendeeCount, 10),
      organizer_type: reservation.organizer_type,
      contact: {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        department: contactDept || null,
      },
      billing_address: {
        name: billingName,
        street: billingStreet,
        postal_code_city: billingCity,
        invoice_note: billingNote || null,
      },
      catering: reservation.catering,
      setup: reservation.setup,
      publication: reservation.publication,
      remarks: remarks || null,
      terms_accepted: true,
    };

    const result = await updateReservation(token, payload);
    setSaving(false);

    if (result.ok) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
  }

  if (success) {
    return (
      <div className="border border-green-200 bg-green-50 px-6 py-5 text-green-900">
        <p className="font-bold">Änderungen gespeichert</p>
        <p className="mt-1 text-sm">
          Ihre Reservation wurde erfolgreich aktualisiert.
        </p>
      </div>
    );
  }

  const inputCls =
    "h-12 w-full border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none focus:border-blue-600";
  const labelCls = "flex flex-col gap-1.5";
  const labelTextCls = "text-xs font-bold uppercase tracking-wide text-slate-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-5">
        <h2 className="text-base font-bold text-slate-800">
          Veranstaltung
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className={`${labelCls} md:col-span-2`}>
            <span className={labelTextCls}>Veranstaltungsname</span>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className={labelTextCls}>Teilnehmeranzahl</span>
            <input
              type="number"
              min={1}
              value={attendeeCount}
              onChange={(e) => setAttendeeCount(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <div className={labelCls}>
            <span className={labelTextCls}>Raum</span>
            <div className="flex h-12 items-center border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500">
              {reservation.room}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <label className={labelCls}>
            <span className={labelTextCls}>Aufbau ab</span>
            <input
              type="time"
              value={setupStart}
              onChange={(e) => setSetupStart(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className={labelTextCls}>Beginn</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className={labelTextCls}>Ende</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className={inputCls}
            />
          </label>
        </div>
      </section>

      <hr className="border-slate-200" />

      <section className="space-y-5">
        <h2 className="text-base font-bold text-slate-800">Kontaktperson</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className={labelCls}>
            <span className={labelTextCls}>Name</span>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className={labelTextCls}>Abteilung</span>
            <input
              type="text"
              value={contactDept}
              onChange={(e) => setContactDept(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className={labelTextCls}>E-Mail</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className={labelTextCls}>Telefon</span>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
              className={inputCls}
            />
          </label>
        </div>
      </section>

      <hr className="border-slate-200" />

      <section className="space-y-5">
        <h2 className="text-base font-bold text-slate-800">Rechnungsadresse</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className={`${labelCls} md:col-span-2`}>
            <span className={labelTextCls}>Firma / Name</span>
            <input
              type="text"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className={labelTextCls}>Strasse</span>
            <input
              type="text"
              value={billingStreet}
              onChange={(e) => setBillingStreet(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className={labelTextCls}>PLZ / Ort</span>
            <input
              type="text"
              value={billingCity}
              onChange={(e) => setBillingCity(e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className={`${labelCls} md:col-span-2`}>
            <span className={labelTextCls}>Rechnungshinweis</span>
            <input
              type="text"
              value={billingNote}
              onChange={(e) => setBillingNote(e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      <hr className="border-slate-200" />

      <section className="space-y-5">
        <h2 className="text-base font-bold text-slate-800">Bemerkungen</h2>
        <label className={labelCls}>
          <span className={labelTextCls}>Bemerkungen (optional)</span>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            className="w-full resize-none border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
          />
        </label>
      </section>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="h-14 w-full bg-blue-900 text-base font-bold uppercase tracking-[0.18em] text-white transition hover:bg-blue-800 disabled:opacity-60"
      >
        {saving ? "Wird gespeichert…" : "Änderungen speichern →"}
      </button>
    </form>
  );
}
