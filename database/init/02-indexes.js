// Indexes for the room_rental database.
//
// Why these indexes:
// - reservations: the conflict-detection query in ReservationDAO.has_conflict
//   filters by room + date + status, then narrows by setup_start_time/end_time.
//   A compound index on (room, date, status) is selective enough that the
//   remaining time-window scan is cheap.
// - reservations.created_at: the list endpoint sorts by it, descending.
// - reservations.contact.email: lets staff look up bookings by requester.
// - rooms.room_id: unique business key.
// - users.username: unique business key for login lookup.

const dbName = process.env.MONGO_INITDB_DATABASE || "room_rental";
const target = db.getSiblingDB(dbName);

target.rooms.createIndex({ room_id: 1 }, { unique: true });

target.reservations.createIndex({ room: 1, date: 1, status: 1 });
target.reservations.createIndex({ created_at: -1 });
target.reservations.createIndex({ "contact.email": 1 });

target.users.createIndex({ username: 1 }, { unique: true });

print(`[init] indexes created in '${dbName}'`);
