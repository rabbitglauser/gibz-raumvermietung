"use client";

import { FormEvent, useMemo, useState } from "react";

type UserRole = "student" | "teacher" | "admin";

type ReservationFormValues = {
  date: string;
  room: string;
  startTime: string;
  endTime: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  idNumber: string;
  reason: string;
  teacherEmail: string;
};

type ReservationFormErrors = Partial<Record<keyof ReservationFormValues, string>>;

const SCHOOL_OPENING_TIME = "07:00";
const SCHOOL_CLOSING_TIME = "18:00";

const initialValues: ReservationFormValues = {
  date: "2024-11-20",
  room: "Konferenzraum B.04",
  startTime: "09:00",
  endTime: "11:00",
  fullName: "",
  email: "",
  phone: "",
  role: "student",
  idNumber: "",
  reason: "",
  teacherEmail: "",
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isInsideSchoolHours(startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const opening = timeToMinutes(SCHOOL_OPENING_TIME);
  const closing = timeToMinutes(SCHOOL_CLOSING_TIME);

  return start >= opening && end <= closing;
}

function validateForm(values: ReservationFormValues) {
  const errors: ReservationFormErrors = {};

  if (!values.date) {
    errors.date = "Bitte wählen Sie ein Datum aus.";
  }

  if (!values.room) {
    errors.room = "Bitte wählen Sie einen Raum aus.";
  }

  if (!values.startTime) {
    errors.startTime = "Bitte wählen Sie eine Startzeit aus.";
  }

  if (!values.endTime) {
    errors.endTime = "Bitte wählen Sie eine Endzeit aus.";
  }

  if (values.startTime && values.endTime) {
    const start = timeToMinutes(values.startTime);
    const end = timeToMinutes(values.endTime);

    if (start >= end) {
      errors.endTime = "Die Endzeit muss nach der Startzeit liegen.";
    }

    if (!isInsideSchoolHours(values.startTime, values.endTime)) {
      errors.startTime = `Buchungen sind nur zwischen ${SCHOOL_OPENING_TIME} und ${SCHOOL_CLOSING_TIME} möglich.`;
    }
  }

  if (!values.fullName.trim()) {
    errors.fullName = "Bitte geben Sie Ihren vollständigen Namen ein.";
  } else if (values.fullName.trim().split(" ").length < 2) {
    errors.fullName = "Bitte geben Sie Vorname und Nachname ein.";
  }

  if (!values.email.trim()) {
    errors.email = "Bitte geben Sie eine E-Mail-Adresse ein.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Bitte geben Sie eine Telefonnummer ein.";
  }

  if (!values.idNumber.trim()) {
    errors.idNumber = "Bitte geben Sie Ihre ID-Nummer ein.";
  } else if (!/^GIB\d{6}$/.test(values.idNumber.trim())) {
    errors.idNumber = "Die ID muss das Format GIB000000 haben.";
  }

  if (!values.reason.trim()) {
    errors.reason = "Bitte geben Sie einen Grund für die Buchung ein.";
  } else if (values.reason.trim().length < 10) {
    errors.reason = "Der Grund muss etwas genauer beschrieben werden.";
  }

  if (values.role === "student") {
    if (!values.teacherEmail.trim()) {
      errors.teacherEmail =
        "Studierende benötigen eine Lehrperson für die Bestätigung.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.teacherEmail)) {
      errors.teacherEmail =
        "Bitte geben Sie eine gültige E-Mail-Adresse der Lehrperson ein.";
    }
  }

  return errors;
}

export default function ReservationForm() {
  const [values, setValues] = useState<ReservationFormValues>(initialValues);
  const [errors, setErrors] = useState<ReservationFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const needsTeacherApproval = values.role === "student";

  const openingHoursText = useMemo(() => {
    return `${SCHOOL_OPENING_TIME} - ${SCHOOL_CLOSING_TIME}`;
  }, []);

  function updateField<K extends keyof ReservationFormValues>(
    field: K,
    value: ReservationFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitted(false);
      return;
    }

    setSubmitted(true);

    console.log("Reservation request:", {
      ...values,
      status: values.role === "student" ? "pending_teacher_approval" : "pending",
    });
  }

  return (
    <section className="w-full max-w-[640px] border border-slate-300 bg-white px-8 py-8 md:px-10 md:py-10">
      <form className="space-y-7" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Datum
            </span>
            <input
              type="date"
              value={values.date}
              onChange={(event) => updateField("date", event.target.value)}
              className={`h-12 w-full border bg-slate-50 px-4 text-slate-900 outline-none ${
                errors.date ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.date && (
              <span className="text-xs font-bold text-red-600">
                {errors.date}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Raum
            </span>
            <select
              value={values.room}
              onChange={(event) => updateField("room", event.target.value)}
              className={`h-12 w-full border bg-slate-50 px-4 text-slate-900 outline-none ${
                errors.room ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option>Konferenzraum B.04</option>
              <option>Seminarraum S104</option>
              <option>Seminarraum 2.112</option>
              <option>Aula 1.005</option>
            </select>
            {errors.room && (
              <span className="text-xs font-bold text-red-600">
                {errors.room}
              </span>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Startzeit
            </span>
            <input
              type="time"
              value={values.startTime}
              onChange={(event) => updateField("startTime", event.target.value)}
              className={`h-12 w-full border bg-white px-4 text-slate-900 outline-none ${
                errors.startTime ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.startTime && (
              <span className="text-xs font-bold text-red-600">
                ⓘ {errors.startTime}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Endzeit
            </span>
            <input
              type="time"
              value={values.endTime}
              onChange={(event) => updateField("endTime", event.target.value)}
              className={`h-12 w-full border bg-white px-4 text-slate-900 outline-none ${
                errors.endTime ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.endTime && (
              <span className="text-xs font-bold text-red-600">
                {errors.endTime}
              </span>
            )}
          </label>
        </div>

        <div className="rounded border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Buchungen sind nur während den Schulöffnungszeiten möglich:{" "}
          <span className="font-bold">{openingHoursText}</span>
        </div>

        <hr className="border-slate-200" />

        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Rolle
          </span>
          <select
            value={values.role}
            onChange={(event) =>
              updateField("role", event.target.value as UserRole)
            }
            className="h-12 w-full border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none"
          >
            <option value="student">Student / Lernende Person</option>
            <option value="teacher">Lehrperson</option>
            <option value="admin">Admin / Verwaltung</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Vollständiger Name
          </span>
          <input
            type="text"
            value={values.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            placeholder="Vorname Nachname"
            className={`h-12 w-full border bg-slate-50 px-4 text-slate-900 outline-none placeholder:text-slate-400 ${
              errors.fullName ? "border-red-500" : "border-slate-300"
            }`}
          />
          {errors.fullName && (
            <span className="text-xs font-bold text-red-600">
              {errors.fullName}
            </span>
          )}
        </label>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              E-Mail Adresse
            </span>
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="beispiel@email.ch"
              className={`h-12 w-full border bg-slate-50 px-4 text-slate-900 outline-none placeholder:text-slate-400 ${
                errors.email ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.email && (
              <span className="text-xs font-bold text-red-600">
                {errors.email}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Telefonnummer
            </span>
            <input
              type="tel"
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+41 00 000 00 00"
              className={`h-12 w-full border bg-slate-50 px-4 text-slate-900 outline-none placeholder:text-slate-400 ${
                errors.phone ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.phone && (
              <span className="text-xs font-bold text-red-600">
                {errors.phone}
              </span>
            )}
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
            ID Nummer
          </span>
          <input
            type="text"
            value={values.idNumber}
            onChange={(event) =>
              updateField("idNumber", event.target.value.toUpperCase())
            }
            placeholder="GIB000000"
            maxLength={9}
            className={`h-12 w-full border bg-slate-50 px-4 text-slate-900 outline-none placeholder:text-slate-400 ${
              errors.idNumber ? "border-red-500" : "border-slate-300"
            }`}
          />
          {errors.idNumber && (
            <span className="text-xs font-bold text-red-600">
              {errors.idNumber}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Grund der Buchung
          </span>
          <textarea
            value={values.reason}
            onChange={(event) => updateField("reason", event.target.value)}
            placeholder="Bitte beschreiben Sie kurz, wofür der Raum benötigt wird."
            rows={4}
            className={`w-full resize-none border bg-slate-50 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 ${
              errors.reason ? "border-red-500" : "border-slate-300"
            }`}
          />
          {errors.reason && (
            <span className="text-xs font-bold text-red-600">
              {errors.reason}
            </span>
          )}
        </label>

        {needsTeacherApproval && (
          <div className="space-y-4 rounded border border-amber-200 bg-amber-50 px-4 py-4">
            <div>
              <p className="text-sm font-bold text-amber-900">
                Lehrperson-Bestätigung erforderlich
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Da Sie als Student buchen, muss eine Lehrperson die Anfrage
                bestätigen. Während der Wartezeit bleibt der Raum provisorisch
                blockiert.
              </p>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-900">
                E-Mail der Lehrperson
              </span>
              <input
                type="email"
                value={values.teacherEmail}
                onChange={(event) =>
                  updateField("teacherEmail", event.target.value)
                }
                placeholder="lehrperson@gibz.ch"
                className={`h-12 w-full border bg-white px-4 text-slate-900 outline-none placeholder:text-slate-400 ${
                  errors.teacherEmail ? "border-red-500" : "border-amber-300"
                }`}
              />
              {errors.teacherEmail && (
                <span className="text-xs font-bold text-red-600">
                  {errors.teacherEmail}
                </span>
              )}
            </label>
          </div>
        )}

        <button
          type="submit"
          className="h-14 w-full bg-blue-900 text-lg font-bold uppercase tracking-[0.18em] text-white transition hover:bg-blue-800"
        >
          Reservierung senden →
        </button>

        <p className="text-center text-xs text-slate-500">
          Mit dem Klick bestätigen Sie unsere{" "}
          <span className="font-bold underline">AGB</span>.
        </p>

        {submitted && (
          <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Die Reservation wurde im Frontend validiert. Die Verbindung zum
            Backend kann im nächsten Schritt ergänzt werden.
          </div>
        )}
      </form>
    </section>
  );
}