// Syncs room seed data from /seeds (mounted from DB/seeds) on first init.

const dbName = process.env.MONGO_INITDB_DATABASE || "room_rental";
const target = db.getSiblingDB(dbName);

const rooms = JSON.parse(cat("/seeds/rooms.json"));

if (rooms.length > 0) {
  const roomIds = rooms.map((room) => room.room_id);
  const stale = target.rooms.deleteMany({ room_id: { $nin: roomIds } });
  const result = target.rooms.bulkWrite(
    rooms.map((room) => ({
      replaceOne: {
        filter: { room_id: room.room_id },
        replacement: room,
        upsert: true,
      },
    }))
  );

  print(
    `[init] synced ${rooms.length} rooms ` +
      `(inserted: ${result.upsertedCount}, modified: ${result.modifiedCount}, stale removed: ${stale.deletedCount})`
  );
} else {
  print("[init] no room seed data found — skipping");
}
