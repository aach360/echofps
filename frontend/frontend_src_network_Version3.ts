import { Client, Room } from "colyseus.js";
export const client = new Client(import.meta.env.VITE_SERVER_URL || "ws://localhost:2567");
export let room: Room;

export async function joinMatch() {
  room = await client.joinOrCreate("echofps");
  return room;
}

export function sendMovement(pos: any, look: any) {
  room.send({ type: "move", data: pos });
  room.send({ type: "look", data: look });
}

export function sendShoot() {
  room.send({ type: "shoot", data: {} });
}

export function sendAbility(ability: string) {
  room.send({ type: "ability", ability });
}

export function sendEcho() {
  room.send({ type: "echo" });
}