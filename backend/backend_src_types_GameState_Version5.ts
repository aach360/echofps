import { Schema, type, MapSchema } from "@colyseus/schema";
import { PlayerState, Team } from "./PlayerState";

export class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type("number") round: number = 1;
  @type("string") phase: string = "waiting";
  @type("number") serverTick: number = 0;
  @type("boolean") echoActive: boolean = false;
  @type("string") echoUser: string = "";
  @type("number") echoReplayTick: number = 0;
  echoSnapshot: any = null;

  addPlayer(sessionId: string, team: Team, pos: {x:number, y:number, z:number}) {
    const player = new PlayerState();
    player.sessionId = sessionId;
    player.team = team;
    player.x = pos.x; player.y = pos.y; player.z = pos.z;
    this.players[sessionId] = player;
  }

  removePlayer(sessionId: string) {
    delete this.players[sessionId];
  }

  updatePlayers() {
    for (const player of Object.values(this.players)) {
      if (player.alive) player.pushHistory();
    }
  }

  saveEchoSnapshot() {
    const snap: any = {};
    for (const sid in this.players) {
      snap[sid] = { ...this.players[sid] };
    }
    this.echoSnapshot = snap;
  }

  restoreEchoSnapshot() {
    if (!this.echoSnapshot) return;
    for (const sid in this.echoSnapshot) {
      Object.assign(this.players[sid], this.echoSnapshot[sid]);
    }
    this.echoActive = false;
    this.echoUser = "";
    this.echoReplayTick = 0;
    Object.values(this.players).forEach((p: any) => {
      p.isGhost = false;
      p.ghostReplayPath = null;
      p.isEchoing = false;
      p.gotEchoKill = false;
    });
  }
}