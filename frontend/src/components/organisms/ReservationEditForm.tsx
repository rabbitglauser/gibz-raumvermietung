"use client";

import { FormEvent, useState } from "react";
import type { EquipmentType, Reservation, ReservationCreate, Room, SeatingType } from "@/lib/api";
import { updateReservation } from "@/lib/reservations";
import { EQUIPMENT_LABEL, SEATING_LABEL } from "@/lib/booking-schema";

interface Props {
  token: string;
  reservation: Reservation;
  room: Room | null;
}

const ALL_EQUIPMENT_TYPES: EquipmentType[] = [
  "projector",
  "flipchart",
  "pinboard",
  "visualizer",
  "whiteboard",
  "laptop",
  "lectern",
  "stage",
];

const CATERING_WINDOWS: Array<{
  key: "before_event" | "during_event" | "after_event";
  label: string;
}> = [
  { key: "before_event", label: "Vor der Veranstaltung" },
  { key: "during_event", label: "Während der Veranstaltung" },
  { key: "after_event", label: "Nach der Veranstaltung" },
];

type EquipmentState = { type: EquipmentType; enabled: boolean; quantity: number };
type WindowState = { enabled: boolean; from_time: string; to_time: string };

function toHHMM(t: string | null | undefined): string {
  return (t ?? "").slice(0, 5);
}

function padTime(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

function initEquipment(room: Room | null, reservation: Reservation): EquipmentState[] {
  const allowedTypes = room
    ? (room.equipment as EquipmentType[])
    : ALL_EQUIPMENT_TYPES.filter((t) =>
        reservation.setup.equipment.some((e) => e.type === t),
      );
  return allowedTypes.map((type) => {
    const existing = reservation.setup.equipment.find((e) => e.type === type);
    return { type, enabled: !!existing, quantity: existing?.quantity ?? 1 };
  });
}

export default function ReservationEditForm({ token, reservation, room }: Props) {
  const [eventName, setEventName] = useState(reservation.event_name);
  const [attendeeCount, setAttendeeCount] = useState(String(reservation.attendee_count));
  const [setupStart, setSetupStart] = useState(toHHMM(reservation.setup_start_time));
  const [startTime, setStartTime] = useState(toHHMM(reservation.start_time));
  const [endTime, setEndTime] = useState(toHHMM(reservation.end_time));

  const [contactName, setContactName] = useState(reservation.contact.name);
  const [contactEmail, setContactEmail] = useState(reservation.contact.email);
  const [contactPhone, setContactPhone] = useState(reservation.contact.phone);
  const [contactDept, setContactDept] = useState(reservation.contact.department ?? "");

  const [billingName, setBillingName] = useState(reservation.billing_address.name);
  const [billingStreet, setBillingStreet] = useState(reservation.billing_address.street);
  const [billingCity, setBillingCity] = useState(reservation.billing_address.postal_code_city);
  const [billingNote, setBillingNote] = useState(reservation.billing_address.invoice_note ?? "");

  const [seatingType, setSeatingType] = useState<SeatingType>(reservation.setup.seating_type);
  const [equipment, setEquipment] = useState<EquipmentState[]>(() =>
    initEquipment(room, reservation),
  );
  const [microphoneNeeded, setMicrophoneNeeded] = useState(reservation.setup.microphone_needed);
  const [techSupportHours, setTechSupportHours] = useState(
    reservation.setup.technical_support_hours != null
      ? String(reservation.setup.technical_support_hours)
      : "",
  );
  const [regieHours, setRegieHours] = useState(
    reservation.setup.regie_hours != null ? String(reservation.setup.regie_hours) : "",
  );

  const [cateringNeeded, setCateringNeeded] = useState(reservation.catering.needed);
  const [cateringWindows, setCateringWindows] = useState<
    Record<"before_event" | "during_event" | "after_event", WindowState>
  >({
    before_event: {
      enabled: reservation.catering.before_event.enabled,
      from_time: toHHMM(reservation.catering.before_event.from_time),
      to_time: toHHMM(reservation.catering.before_event.to_time),
    },
    during_event: {
      enabled: reservation.catering.during_event.enabled,
      from_time: toHHMM(reservation.catering.during_event.from_time),
      to_time: toHHMM(reservation.catering.during_event.to_time),
    },
    after_event: {
      enabled: reservation.catering.after_event.enabled,
      from_time: toHHMM(reservation.catering.after_event.from_time),
      to_time: toHHMM(reservation.catering.after_event.to_time),
    },
  });

  const [publishOnInfoScreen, setPublishOnInfoScreen] = useState(
    reservation.publication?.publish_on_info_screen ?? false,
  );
  const [infoScreenText, setInfoScreenText] = useState(
    reservation.publication?.info_screen_text ?? "",
  );
  const [publishTargetGroups, setPublishTargetGroups] = useState<string[]>(
    reservation.publication?.publish_target_groups ?? [],
  );

  const [remarks, setRemarks] = useState(reservation.remarks ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const allowedSeating = room
    ? (room.seating_types as SeatingType[])
    : [reservation.setup.seating_type];
  const microphoneAvailable = room ? room.microphone : reservation.setup.microphone_needed;
  const techSupportAvailable = room
    ? room.technical_support
    : (reservation.setup.technical_support_hours ?? 0) > 0;
  const regieAvailable = room
    ? room.room_id === "aula-1-005"
    : (reservation.setup.regie_hours ?? 0) > 0;
  const publicationOptions = room?.publication_options ?? [];

  function toggleEquipment(type: EquipmentType, enabled: boolean) {
    setEquipment((prev) => prev.map((e) => (e.type === type ? { ...e, enabled } : e)));
  }

  function setEquipmentQty(type: EquipmentType, quantity: number) {
    setEquipment((prev) =>
      prev.map((e) => (e.type === type ? { ...e, quantity: Math.max(1, quantity) } : e)),
    );
  }

  function updateWindow(
    key: "before_event" | "during_event" | "after_event",
    field: keyof WindowState,
    value: boolean | string,
  ) {
    setCateringWindows((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function toggleTargetGroup(group: string, checked: boolean) {
    setPublishTargetGroups((prev) =>
      checked ? Array.from(new Set([...prev, group])) : prev.filter((g) => g !== group),
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const enabledEquipment = equipment
      .filter((eq) => eq.enabled)
      .map((eq) => ({ type: eq.type, quantity: eq.quantity }));

    const buildWindow = (key: "before_event" | "during_event" | "after_event") => {
      const w = cateringWindows[key];
      return {
        enabled: w.enabled,
        from_time: w.enabled && w.from_time ? padTime(w.from_time) : null,
        to_time: w.enabled && w.to_time ? padTime(w.to_time) : null,
      };
    };

    const payload: ReservationCreate = {
      event_name: eventName,
      date: reservation.date,
      setup_start_time: padTime(setupStart),
      start_time: padTime(startTime),
      end_time: padTime(endTime),
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
      setup: {
        seating_type: seatingType,
        equipment: enabledEquipment,
        microphone_needed: microphoneNeeded,
        technical_support_hours: techSupportHours !== "" ? parseFloat(techSupportHours) : null,
        regie_hours: regieHours !== "" ? parseFloat(regieHours) : null,
      },
      catering: {
        needed: cateringNeeded,
        before_event: buildWindow("before_event"),
        during_event: buildWindow("during_event"),
        after_event: buildWindow("after_event"),
      },
      publication: {
        info_screen_text: publishOnInfoScreen ? infoScreenText || null : null,
        publish_on_info_screen: publishOnInfoScreen,
        publish_target_groups: publishOnInfoScreen ? publishTargetGroups : [],
      },
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
        <p className="mt-1 text-sm">Ihre Reservation wurde erfolgreich aktualisiert.</p>
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
        <h2 className="text-base font-bold text-slate-800">Veranstaltung</h2>

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
        <h2 className="text-base font-bold text-slate-800">Bestuhlung & Material</h2>

        <label className={labelCls}>
          <span className={labelTextCls}>Bestuhlung</span>
          <select
            value={seatingType}
            onChange={(e) => setSeatingType(e.target.value as SeatingType)}
            className={inputCls}
          >
            {allowedSeating.map((s) => (
              <option key={s} value={s}>
                {SEATING_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        {equipment.length > 0 && (
          <div>
            <span className={labelTextCls}>Zusatzmaterial</span>
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {equipment.map(({ type, enabled, quantity }) => (
                <li
                  key={type}
                  className={`flex items-center justify-between gap-2 border px-3 py-2 ${
                    enabled
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <label className="flex items-center gap-2 text-sm text-slate-800">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => toggleEquipment(type, e.target.checked)}
                      className="h-4 w-4 accent-blue-700"
                    />
                    {EQUIPMENT_LABEL[type]}
                  </label>
                  {enabled && (
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setEquipmentQty(type, Number(e.target.value || 1))}
                      className="h-8 w-16 border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          {microphoneAvailable && (
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={microphoneNeeded}
                onChange={(e) => setMicrophoneNeeded(e.target.checked)}
                className="h-4 w-4 accent-blue-700"
              />
              Mikrofonanlage gewünscht
            </label>
          )}

          {techSupportAvailable && (
            <label className={labelCls}>
              <span className={labelTextCls}>Techn. Support (Std.)</span>
              <input
                type="number"
                min={0}
                step="0.5"
                value={techSupportHours}
                onChange={(e) => setTechSupportHours(e.target.value)}
                className="h-10 w-36 border border-slate-300 bg-slate-50 px-3 text-slate-900 outline-none focus:border-blue-600"
              />
            </label>
          )}

          {regieAvailable && (
            <label className={labelCls}>
              <span className={labelTextCls}>Regie (Std.)</span>
              <input
                type="number"
                min={0}
                step="0.5"
                value={regieHours}
                onChange={(e) => setRegieHours(e.target.value)}
                className="h-10 w-36 border border-slate-300 bg-slate-50 px-3 text-slate-900 outline-none focus:border-blue-600"
              />
            </label>
          )}
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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Verpflegung</h2>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={cateringNeeded}
              onChange={(e) => setCateringNeeded(e.target.checked)}
              className="h-4 w-4 accent-blue-700"
            />
            Verpflegung gewünscht
          </label>
        </div>

        {cateringNeeded && (
          <ul className="space-y-2">
            {CATERING_WINDOWS.map(({ key, label }) => {
              const win = cateringWindows[key];
              return (
                <li key={key} className="border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center gap-2 text-sm text-slate-800">
                    <input
                      type="checkbox"
                      checked={win.enabled}
                      onChange={(e) => updateWindow(key, "enabled", e.target.checked)}
                      className="h-4 w-4 accent-blue-700"
                    />
                    {label}
                  </label>
                  {win.enabled && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className={labelCls}>
                        <span className={labelTextCls}>Von</span>
                        <input
                          type="time"
                          value={win.from_time}
                          onChange={(e) => updateWindow(key, "from_time", e.target.value)}
                          className={inputCls}
                        />
                      </label>
                      <label className={labelCls}>
                        <span className={labelTextCls}>Bis</span>
                        <input
                          type="time"
                          value={win.to_time}
                          onChange={(e) => updateWindow(key, "to_time", e.target.value)}
                          className={inputCls}
                        />
                      </label>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <hr className="border-slate-200" />

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Publikation</h2>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={publishOnInfoScreen}
              onChange={(e) => setPublishOnInfoScreen(e.target.checked)}
              className="h-4 w-4 accent-blue-700"
            />
            Auf Info-Bildschirm publizieren
          </label>
        </div>

        {publishOnInfoScreen && (
          <div className="space-y-4">
            <label className={labelCls}>
              <span className={labelTextCls}>Text auf Info-Bildschirm</span>
              <textarea
                value={infoScreenText}
                onChange={(e) => setInfoScreenText(e.target.value)}
                rows={2}
                className="w-full resize-none border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
              />
            </label>

            {publicationOptions.length > 0 && (
              <div>
                <span className={labelTextCls}>Zielgruppen</span>
                <ul className="mt-2 grid grid-cols-2 gap-2">
                  {publicationOptions.map((group) => {
                    const checked = publishTargetGroups.includes(group);
                    return (
                      <li key={group}>
                        <label
                          className={`flex items-center gap-2 border px-3 py-2 text-sm text-slate-800 ${
                            checked ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleTargetGroup(group, e.target.checked)}
                            className="h-4 w-4 accent-blue-700"
                          />
                          {group}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
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
