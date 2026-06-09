// Runs once on first container start (when /data/db is empty).
// Creates collections with JSON Schema validators for the room_rental database.
//
// Mirrors the Pydantic models in backend/app/models/.

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

const USER_ROLES = [
  "staff",
  "secretariat",
  "hausdienst",
  "restaurant_treff",
  "admin",
];

target.createCollection("rooms", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "room_id",
        "sort_order",
        "name",
        "room_number",
        "building",
        "floor",
        "area_m2",
        "location",
        "description",
        "capacity",
        "seating_types",
        "equipment",
        "inspection_contact",
        "fixed_setup",
        "seating_options",
        "pricing",
        "catering",
        "reservation",
      ],
      properties: {
        room_id: { enum: ROOM_IDS },
        sort_order: { bsonType: ["int", "double"], minimum: 1 },
        name: { bsonType: "string", minLength: 1 },
        room_number: { bsonType: "string", minLength: 1 },
        building: { bsonType: "string", minLength: 1 },
        floor: { bsonType: "string", minLength: 1 },
        area_m2: { bsonType: ["int", "double"], minimum: 1 },
        location: { bsonType: "string", minLength: 1 },
        description: { bsonType: "string", minLength: 1 },
        image_path: { bsonType: ["string", "null"] },
        image_note: { bsonType: ["string", "null"] },
        capacity: { bsonType: ["int", "double"], minimum: 1 },
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
        inspection_contact: {
          bsonType: "object",
          required: ["name", "email"],
          properties: {
            name: { bsonType: "string", minLength: 1 },
            email: { bsonType: "string", minLength: 1 },
            phone: { bsonType: ["string", "null"] },
          },
        },
        fixed_setup: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        notebook_connections: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        internet_access: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        seating_options: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["type", "label"],
            properties: {
              type: { enum: SEATING_TYPES },
              label: { bsonType: "string", minLength: 1 },
              max_people: { bsonType: ["int", "double", "null"], minimum: 1 },
              max_tables: { bsonType: ["int", "double", "null"], minimum: 1 },
              recommended_tables: { bsonType: ["int", "double", "null"], minimum: 1 },
              table_size: { bsonType: ["string", "null"] },
              max_chairs_per_table: { bsonType: ["int", "double", "null"], minimum: 1 },
              recommended_chairs_per_table: { bsonType: ["int", "double", "null"], minimum: 1 },
              notes: {
                bsonType: "array",
                items: { bsonType: "string" },
              },
            },
          },
        },
        additional_material: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name"],
            properties: {
              name: { bsonType: "string", minLength: 1 },
              max_quantity: { bsonType: ["int", "double", "null"], minimum: 1 },
              dimensions: { bsonType: ["string", "null"] },
              notes: {
                bsonType: "array",
                items: { bsonType: "string" },
              },
            },
          },
        },
        microphones: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["kind", "quantity"],
            properties: {
              kind: { bsonType: "string", minLength: 1 },
              quantity: { bsonType: ["int", "double"], minimum: 1 },
            },
          },
        },
        microphone_notes: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        pricing: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["organizer_type", "label"],
            properties: {
              organizer_type: { enum: ORGANIZER_TYPES },
              label: { bsonType: "string", minLength: 1 },
              half_day_chf: { bsonType: ["int", "double", "null"], minimum: 0 },
              full_day_chf: { bsonType: ["int", "double", "null"], minimum: 0 },
              note: { bsonType: ["string", "null"] },
            },
          },
        },
        catering: {
          bsonType: "object",
          required: ["required", "provider", "contact"],
          properties: {
            required: { bsonType: "bool" },
            provider: { bsonType: "string", minLength: 1 },
            contact: {
              bsonType: "object",
              required: ["name", "email"],
              properties: {
                name: { bsonType: "string", minLength: 1 },
                email: { bsonType: "string", minLength: 1 },
                phone: { bsonType: ["string", "null"] },
              },
            },
            notes: {
              bsonType: "array",
              items: { bsonType: "string" },
            },
          },
        },
        reservation: {
          bsonType: "object",
          required: ["send_to_email", "catering_send_to_email"],
          properties: {
            send_to_email: { bsonType: "string", minLength: 1 },
            catering_send_to_email: { bsonType: "string", minLength: 1 },
            approval_date: { bsonType: ["string", "null"] },
            approved_by: { bsonType: ["string", "null"] },
          },
        },
        reservation_notes: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        publication_options: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
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
        reminder_sent_at: { bsonType: ["date", "null"] },
        reminder_count: { bsonType: ["int", "null"], minimum: 0 },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
      },
    },
  },
  validationLevel: "moderate",
});

target.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "password_hash", "role", "name", "email"],
      properties: {
        username: { bsonType: "string", minLength: 1 },
        password_hash: { bsonType: "string", minLength: 1 },
        role: { enum: USER_ROLES },
        name: { bsonType: "string", minLength: 1 },
        email: { bsonType: "string" },
        created_at: { bsonType: ["date", "null"] },
      },
    },
  },
});

print(`[init] collections created in '${dbName}': rooms, reservations, users`);
