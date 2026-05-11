import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Room } from "./api";

const roomsPath = join(process.cwd(), "..", "database", "seeds", "rooms.json");
const rooms = JSON.parse(readFileSync(roomsPath, "utf8")) as Room[];

export function getStaticRooms() {
  return [...rooms].sort((a, b) => a.sort_order - b.sort_order);
}

export function getStaticRoom(roomId: string) {
  return getStaticRooms().find((room) => room.room_id === roomId) ?? null;
}
