// Runs once on first container start (when /data/db is empty).
// Creates collections with JSON Schema validators for the room_rental database.
//
// Mirrors the Pydantic models in backend/app/routers/reservations.py.

const dbName = process.env.MONGO_INITDB_DATABASE || "room_rental";
const target = db.getSiblingDB(dbName);

const ROOM_IDS = [
  "seminarraum-5-003-004",
  "seminarraum-2-112",
  "aula-1-005",
];

const ORGANIZER_TYPES = [
  "external_customer",
  "public_sector_oda",
  "cantonal_admin_zug",
  "gibz_internal_school_event",
  "gibz_internal_private_event",
];

const RESERVATION_STATUSES = ["pending", "confirmed", "rejected", "cancelled"];

const SEATING_TYPES = ["seminar", "block", "theater", "u_shape", "banquet", "exam"];

const EQUIPMENT_TYPES = [
  "projector",
  "flipchart",
  "pinboard",
  "visualizer",
  "whiteboard",
  "laptop",
  "lectern",
  "stage",
];

target.createCollection("rooms", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["room_id", "capacity", "seating_types", "equipment"],
      properties: {
        room_id: { enum: ROOM_IDS },
        capacity: { bsonType: "int", minimum: 1 },
        seating_types: {
          bsonType: "array",
          items: { enum: SEATING_TYPES },
        },
        equipment: {
          bsonType: "array",
          items: { enum: EQUIPMENT_TYPES },
        },
        microphone: { bsonType: "bool" },
        technical_support: { bsonType: "bool" },
      },
    },
  },
});

target.createCollection("reservations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "event_name",
        "date",
        "setup_start_time",
        "start_time",
        "end_time",
        "room",
        "attendee_count",
        "organizer_type",
        "contact",
        "billing_address",
        "setup",
        "terms_accepted",
        "status",
        "created_at",
        "updated_at",
      ],
      properties: {
        event_name: { bsonType: "string", minLength: 1 },
        date: { bsonType: "string" },
        setup_start_time: { bsonType: "string" },
        start_time: { bsonType: "string" },
        end_time: { bsonType: "string" },
        room: { enum: ROOM_IDS },
        attendee_count: { bsonType: "int", minimum: 1 },
        organizer_type: { enum: ORGANIZER_TYPES },
        status: { enum: RESERVATION_STATUSES },
        terms_accepted: { bsonType: "bool" },
        contact: {
          bsonType: "object",
          required: ["name", "email", "phone"],
          properties: {
            name: { bsonType: "string", minLength: 1 },
            email: { bsonType: "string" },
            phone: { bsonType: "string", minLength: 1 },
            department: { bsonType: ["string", "null"] },
          },
        },
        billing_address: {
          bsonType: "object",
          required: ["name", "street", "postal_code_city"],
          properties: {
            name: { bsonType: "string", minLength: 1 },
            street: { bsonType: "string", minLength: 1 },
            postal_code_city: { bsonType: "string", minLength: 1 },
            invoice_note: { bsonType: ["string", "null"] },
          },
        },
        setup: {
          bsonType: "object",
          required: ["seating_type", "equipment"],
          properties: {
            seating_type: { enum: SEATING_TYPES },
            equipment: {
              bsonType: "array",
              items: {
                bsonType: "object",
                required: ["type", "quantity"],
                properties: {
                  type: { enum: EQUIPMENT_TYPES },
                  quantity: { bsonType: "int", minimum: 1 },
                },
              },
            },
            microphone_needed: { bsonType: "bool" },
            technical_support_hours: { bsonType: ["double", "int", "null"] },
            regie_hours: { bsonType: ["double", "int", "null"] },
          },
        },
        catering: { bsonType: "object" },
        publication: { bsonType: ["object", "null"] },
        remarks: { bsonType: ["string", "null"] },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
});

print(`[init] collections created in '${dbName}': rooms, reservations`);
