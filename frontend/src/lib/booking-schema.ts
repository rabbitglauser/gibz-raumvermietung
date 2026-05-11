import { z } from "zod";

import type {
  EquipmentType,
  OrganizerType,
  Room,
  RoomId,
  SeatingType,
} from "./api";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeString = z
  .string()
  .regex(TIME_RE, "Format HH:MM erwartet");

const perDateTimes = z
  .object({
    setupStart: timeString.optional().or(z.literal("")),
    start: timeString,
    end: timeString,
  })
  .refine((v) => v.start < v.end, {
    message: "Endzeit muss nach Startzeit liegen",
    path: ["end"],
  })
  .refine(
    (v) => !v.setupStart || v.setupStart === "" || v.setupStart <= v.start,
    {
      message: "Aufbau muss vor der Startzeit liegen",
      path: ["setupStart"],
    },
  );

export const datesStepSchema = z
  .object({
    dates: z
      .array(z.date())
      .min(1, "Bitte mindestens ein Datum auswählen"),
    times: z.record(z.string(), perDateTimes),
  })
  .refine(
    (v) => v.dates.every((d) => v.times[toIso(d)] !== undefined),
    { message: "Bitte für jedes Datum Zeiten festlegen", path: ["times"] },
  );

const equipmentItemSchema = z.object({
  type: z.enum([
    "projector",
    "flipchart",
    "pinboard",
    "visualizer",
    "whiteboard",
    "laptop",
    "lectern",
    "stage",
  ]) satisfies z.ZodType<EquipmentType>,
  enabled: z.boolean(),
  quantity: z.number().int().min(1).max(50),
});

const seatingEnum = z.enum([
  "seminar",
  "block",
  "theater",
  "u_shape",
  "banquet",
  "exam",
]) satisfies z.ZodType<SeatingType>;

const organizerEnum = z.enum([
  "external_customer",
  "public_sector_oda",
  "cantonal_admin_zug",
  "gibz_internal_school_event",
  "gibz_internal_private_event",
]) satisfies z.ZodType<OrganizerType>;

const roomEnum = z.enum([
  "seminarraum-5-003-004",
  "seminarraum-2-112",
  "aula-1-005",
]) satisfies z.ZodType<RoomId>;

export const eventStepSchema = z.object({
  event_name: z.string().min(1, "Pflichtfeld"),
  room: roomEnum,
  attendee_count: z.number().int().min(1, "Mindestens 1 Person"),
  organizer_type: organizerEnum,
  seating_type: seatingEnum,
  equipment: z.array(equipmentItemSchema),
  microphone_needed: z.boolean(),
  technical_support_hours: z.number().nonnegative().nullable().optional(),
  regie_hours: z.number().nonnegative().nullable().optional(),
});

export const contactStepSchema = z.object({
  contact: z.object({
    name: z.string().min(1, "Pflichtfeld"),
    email: z.string().email("Ungültige E-Mail"),
    phone: z.string().min(1, "Pflichtfeld"),
    department: z.string().optional().nullable(),
  }),
  billing: z.object({
    name: z.string().min(1, "Pflichtfeld"),
    street: z.string().min(1, "Pflichtfeld"),
    postal_code_city: z.string().min(1, "Pflichtfeld"),
    invoice_note: z.string().optional().nullable(),
  }),
});

const cateringWindowSchema = z
  .object({
    enabled: z.boolean(),
    from_time: z.string().optional().nullable(),
    to_time: z.string().optional().nullable(),
  })
  .refine(
    (v) =>
      !v.enabled ||
      (!!v.from_time &&
        !!v.to_time &&
        TIME_RE.test(v.from_time) &&
        TIME_RE.test(v.to_time) &&
        v.from_time < v.to_time),
    {
      message: "Wenn aktiv: gültige Von-/Bis-Zeit",
      path: ["to_time"],
    },
  );

export const extrasStepSchema = z
  .object({
    catering: z
      .object({
        needed: z.boolean(),
        before_event: cateringWindowSchema,
        during_event: cateringWindowSchema,
        after_event: cateringWindowSchema,
      })
      .refine(
        (c) =>
          !c.needed ||
          c.before_event.enabled ||
          c.during_event.enabled ||
          c.after_event.enabled,
        {
          message:
            "Bitte mindestens ein Verpflegungs-Fenster aktivieren oder Verpflegung deaktivieren",
          path: ["needed"],
        },
      ),
    publication: z.object({
      info_screen_text: z.string().optional().nullable(),
      publish_on_info_screen: z.boolean(),
      publish_target_groups: z.array(z.string()),
    }),
    remarks: z.string().optional().nullable(),
    terms_accepted: z
      .boolean()
      .refine((v) => v === true, "Bitte AGB akzeptieren"),
  });

export const bookingFormSchema = z.object({
  dates: z.array(z.date()),
  times: z.record(z.string(), perDateTimes),
  event: eventStepSchema,
  contact: contactStepSchema.shape.contact,
  billing: contactStepSchema.shape.billing,
  setup: z.object({
    seating_type: seatingEnum,
    equipment: z.array(equipmentItemSchema),
    microphone_needed: z.boolean(),
    technical_support_hours: z.number().nonnegative().nullable().optional(),
    regie_hours: z.number().nonnegative().nullable().optional(),
  }),
  catering: extrasStepSchema.shape.catering,
  publication: extrasStepSchema.shape.publication,
  remarks: z.string().optional().nullable(),
  terms_accepted: z.boolean().refine((v) => v === true, "Bitte AGB akzeptieren"),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type EventStepValues = z.infer<typeof eventStepSchema>;

export interface RoomRule {
  capacity: number;
  allowed_seating: SeatingType[];
  allowed_equipment: EquipmentType[];
  microphone_available: boolean;
  technical_support_available: boolean;
  regie_available: boolean;
}

export function deriveRoomRule(room: Room): RoomRule {
  return {
    capacity: room.capacity,
    allowed_seating: room.seating_types as SeatingType[],
    allowed_equipment: room.equipment as EquipmentType[],
    microphone_available: room.microphone,
    technical_support_available: room.technical_support,
    regie_available: room.room_id === "aula-1-005",
  };
}

export function validateAgainstRoom(
  values: Pick<
    BookingFormValues,
    "event" | "setup"
  >,
  rule: RoomRule,
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (values.event.attendee_count > rule.capacity) {
    errors["event.attendee_count"] = `Kapazität max. ${rule.capacity} Personen`;
  }
  if (!rule.allowed_seating.includes(values.setup.seating_type)) {
    errors["setup.seating_type"] = "Bestuhlung für diesen Raum nicht verfügbar";
  }
  for (const [i, eq] of values.setup.equipment.entries()) {
    if (eq.enabled && !rule.allowed_equipment.includes(eq.type)) {
      errors[`setup.equipment.${i}`] = "Material in diesem Raum nicht verfügbar";
    }
  }
  if (values.setup.microphone_needed && !rule.microphone_available) {
    errors["setup.microphone_needed"] =
      "Mikrofonanlage in diesem Raum nicht verfügbar";
  }
  if (
    (values.setup.technical_support_hours ?? 0) > 0 &&
    !rule.technical_support_available
  ) {
    errors["setup.technical_support_hours"] =
      "Technischer Support in diesem Raum nicht verfügbar";
  }
  if ((values.setup.regie_hours ?? 0) > 0 && !rule.regie_available) {
    errors["setup.regie_hours"] = "Regie nur in der Aula verfügbar";
  }

  if (Object.keys(errors).length === 0) return { ok: true };
  return { ok: false, errors };
}

export const ORGANIZER_LABEL: Record<OrganizerType, string> = {
  external_customer: "Externe Kundin / Externer Kunde",
  public_sector_oda: "Öffentliche Hand, OdA",
  cantonal_admin_zug: "Kantonale Verwaltung Zug",
  gibz_internal_school_event: "GIBZ intern (Schulanlass)",
  gibz_internal_private_event: "GIBZ intern (privat)",
};

export const SEATING_LABEL: Record<SeatingType, string> = {
  seminar: "Seminarbestuhlung",
  block: "Blockbestuhlung",
  theater: "Konzertbestuhlung",
  u_shape: "U-Bestuhlung",
  banquet: "Bankettbestuhlung",
  exam: "Prüfungsbestuhlung",
};

export const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  projector: "Beamer",
  flipchart: "Flipchart",
  pinboard: "Pinwand",
  visualizer: "Visualizer",
  whiteboard: "Whiteboard",
  laptop: "Notebook",
  lectern: "Rednerpult",
  stage: "Bühne",
};

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
