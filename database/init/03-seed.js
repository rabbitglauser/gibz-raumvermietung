// Imports seed data from /seeds (mounted from DB/seeds) on first init.

const dbName = process.env.MONGO_INITDB_DATABASE || "room_rental";
const target = db.getSiblingDB(dbName);

const rooms = JSON.parse(cat("/seeds/rooms.json"));

if (rooms.length > 0 && target.rooms.countDocuments() === 0) {
  target.rooms.insertMany(rooms);
  print(`[init] inserted ${rooms.length} rooms`);
} else {
  print("[init] rooms collection not empty or no seed data — skipping");
}
