import { Schema, type, MapSchema } from "@colyseus/schema";

export enum Team { Blue = "Blue", Red = "Red" }

export class PlayerHistoryEntry extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("number") z: number;
  @type("number") rotY: number;
  @type("number") rotX: number;
  @type("number") tick: number;
  constructor(x: number, y: number, z: number, rotY: number, rotX: number, tick: number) {
    super();
    this.x = x; this.y = y; this.z = z;
    this.rotY = rotY; this.rotX = rotX; this.tick = tick;
  }
}

export class PlayerState extends Schema {
  @type("string") sessionId: string = "";
  @type("string") name: string = "";
  @type("string") agent: string = "Lapse";
  @type("string") team: Team = Team.Blue;
  @type("number") x: number = 0;
  @type("number") y: number = 2;
  @type("number") z: number = 0;
  @type("number") rotY: number = 0;
  @type("number") rotX: number = 0;
  @type("boolean") alive: boolean = true;
  @type("number") health: number = 100;
  @type("number") ammo: number = 10;
  @type("number") lastShot: number = 0;
  @type("number") velocityY: number = 0;
  @type("boolean") isCrouching: boolean = false;

  @type({ map: "number" }) abilities = new MapSchema<number>();
  history: PlayerHistoryEntry[] = [];
  isGhost: boolean = false;
  ghostReplayPath: any = null;
  isEchoing: boolean = false;
  gotEchoKill: boolean = false;
  ghostTrail: any[] = [];
  timeprint: any = null;
  slowUntil: number = 0;

  pushHistory() {
    this.history.push(new PlayerHistoryEntry(this.x, this.y, this.z, this.rotY, this.rotX, Date.now()));
    if (this.history.length > 600) this.history.shift();
  }

  canShoot() {
    return this.ammo > 0 && Date.now() - this.lastShot > 500;
  }
  canEcho() {
    // For now, always allow
    return true;
  }
}