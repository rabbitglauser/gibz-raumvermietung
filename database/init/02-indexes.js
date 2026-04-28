// Indexes for the room_rental database.
// Tuned for the conflict-detection query in backend/app/routers/reservations.py
// (filters by room + date + status, then time-window overlap).

const dbName = process.env.MONGO_INITDB_DATABASE || "room_rental";
const target = db.getSiblingDB(dbName);

target.rooms.createIndex({ room_id: 1 }, { unique: true });

target.reservations.createIndex({ room: 1, date: 1, status: 1 });
target.reservations.createIndex({ created_at: -1 });
target.reservations.createIndex({ "contact.email": 1 });

print(`[init] indexes created in '${dbName}'`);
