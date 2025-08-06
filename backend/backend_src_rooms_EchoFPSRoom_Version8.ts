import { Room, Client } from "colyseus";
import { GameState } from "../types/GameState";
import { PlayerState, Team } from "../types/PlayerState";
import { intersectsBoundingBox } from "../utils/raycast";

const TICK_RATE = 20;
const SPAWN_POINTS = {
  Blue: [ { x: -10, y: 2, z: 0 }, { x: -12, y: 2, z: 2 }, { x: -14, y: 2, z: -2 }, { x: -10, y: 2, z: 5 }, { x: -12, y: 2, z: -4 } ],
  Red:  [ { x: 10, y: 2, z: 0 }, { x: 12, y: 2, z: 2 }, { x: 14, y: 2, z: -2 }, { x: 10, y: 2, z: 5 }, { x: 12, y: 2, z: -4 } ],
};

export class EchoFPSRoom extends Room<GameState> {
  maxClients = 10;

  onCreate() {
    this.setState(new GameState());
    this.setSimulationInterval(() => this.update(), 1000 / TICK_RATE);
  }

  assignTeam(): Team {
    const blue = Object.values(this.state.players).filter((p: PlayerState) => p.team === Team.Blue).length;
    const red = Object.values(this.state.players).filter((p: PlayerState) => p.team === Team.Red).length;
    return blue <= red ? Team.Blue : Team.Red;
  }

  onJoin(client: Client, options: any) {
    const team = this.assignTeam();
    const spawnIdx = Object.values(this.state.players).filter((p: PlayerState) => p.team === team).length % 5;
    const pos = SPAWN_POINTS[team][spawnIdx];
    this.state.addPlayer(client.sessionId, team, pos);
    client.send({ type: "spawn", team, pos, agent: "Lapse" });
  }

  onLeave(client: Client) {
    this.state.removePlayer(client.sessionId);
  }

  onMessage(client: Client, message: any) {
    const player = this.state.players[client.sessionId];
    if (!player || !player.alive) return;
    switch (message.type) {
      case "move":
        this.validateAndApplyMovement(player, message.data);
        break;
      case "look":
        player.rotY = message.data.rotY;
        player.rotX = message.data.rotX;
        break;
      case "shoot":
        this.handleShooting(client.sessionId, message.data);
        break;
      case "ability":
        this.handleAbility(client.sessionId, message.ability, message.data);
        break;
      case "echo":
        this.tryTriggerEcho(client.sessionId);
        break;
    }
  }

  validateAndApplyMovement(player: PlayerState, data: any) {
    const dx = data.x - player.x, dy = data.y - player.y, dz = data.z - player.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dist > 0.7) return;
    player.x = data.x;
    player.y = data.y;
    player.z = data.z;
    player.velocityY = data.velocityY || 0;
    player.isCrouching = !!data.isCrouching;
    player.pushHistory();
  }

  handleShooting(sessionId: string, data: any) {
    const player = this.state.players[sessionId];
    if (!player.canShoot()) return;
    const origin = { x: player.x, y: player.y + 0.8, z: player.z };
    const dir = {
      x: Math.sin(player.rotY) * Math.cos(player.rotX),
      y: Math.sin(player.rotX),
      z: Math.cos(player.rotY) * Math.cos(player.rotX),
    };
    let hit = null;
    let hitDist = Number.MAX_VALUE;
    for (const [id, other] of Object.entries(this.state.players)) {
      if (id === sessionId || !other.alive || other.team === player.team) continue;
      if (intersectsBoundingBox(origin, dir, { x: other.x, y: other.y, z: other.z }, { w: 0.5, h: 1.7, d: 0.5 })) {
        const dx = other.x - player.x, dy = other.y - player.y, dz = other.z - player.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < hitDist) { hit = other; hitDist = dist; }
      }
    }
    if (hit) {
      hit.health -= 25;
      hit.velocityY += 0.15;
      if (hit.health <= 0) {
        hit.alive = false;
        this.broadcast("death", { victim: hit.sessionId, killer: sessionId });
        if (player.isEchoing) player.gotEchoKill = true;
      }
    }
    player.ammo--;
    player.lastShot = Date.now();
  }

  handleAbility(sessionId: string, ability: string, data: any) {
    const player = this.state.players[sessionId];
    const now = Date.now();
    if (player.abilities[ability] && player.abilities[ability] > now) return;
    switch (ability) {
      case "Timeprint":
        player.timeprint = { x: player.x, y: player.y, z: player.z, rotY: player.rotY, rotX: player.rotX, tick: this.state.serverTick };
        this.broadcast("ability", { user: sessionId, ability, effect: "timeprint", pos: player.timeprint });
        break;
      case "ChronoGrenade":
        for (const other of Object.values(this.state.players)) {
          if (other.team !== player.team && Math.abs(player.x - other.x) < 5 && Math.abs(player.z - other.z) < 5) {
            other.slowUntil = now + 4000;
          }
        }
        this.broadcast("ability", { user: sessionId, ability, effect: "chrono_grenade", center: { x: player.x, z: player.z } });
        break;
      case "Ripple":
        for (const other of Object.values(this.state.players)) {
          if (other.team !== player.team && Math.abs(player.x - other.x) < 2 && Math.abs(player.z - other.z) < 2) {
            other.health -= 10;
            other.velocityY += 0.2;
          }
        }
        this.broadcast("ability", { user: sessionId, ability, effect: "ripple", center: { x: player.x, z: player.z } });
        break;
    }
    player.abilities[ability] = now + 10000;
  }

  tryTriggerEcho(sessionId: string) {
    const player = this.state.players[sessionId];
    if (!player.canEcho()) return;
    this.state.echoActive = true;
    this.state.echoUser = sessionId;
    this.state.echoReplayTick = 0;
    this.state.saveEchoSnapshot();
    this.broadcast("echo", { user: sessionId });
  }

  handleEchoReplay() {
    const echoUser = this.state.players[this.state.echoUser];
    if (!echoUser) return;
    if (this.state.echoReplayTick === 0) {
      const history = echoUser.history;
      if (history.length < 100) return;
      const rewindState = history[history.length - 100];
      echoUser.x = rewindState.x;
      echoUser.y = rewindState.y;
      echoUser.z = rewindState.z;
      echoUser.rotY = rewindState.rotY;
      echoUser.rotX = rewindState.rotX;
      echoUser.alive = true;
      echoUser.health = 100;
      echoUser.isEchoing = true;
      echoUser.ghostTrail = [];
      Object.values(this.state.players).forEach((p: any) => {
        if (p.sessionId !== echoUser.sessionId && p.alive) {
          p.isGhost = true;
          p.ghostReplayPath = p.history.slice(history.length - 100, history.length);
        }
      });
    }
    const replayTick = this.state.echoReplayTick;
    Object.values(this.state.players).forEach((p: any) => {
      if (p.isGhost && p.ghostReplayPath && replayTick < p.ghostReplayPath.length) {
        const ghostFrame = p.ghostReplayPath[replayTick];
        if (ghostFrame) {
          p.x = ghostFrame.x;
          p.y = ghostFrame.y;
          p.z = ghostFrame.z;
          p.rotY = ghostFrame.rotY;
          p.rotX = ghostFrame.rotX;
          if (!p.ghostTrail) p.ghostTrail = [];
          p.ghostTrail.push({ x: p.x, y: p.y, z: p.z });
        }
      }
    });
    this.state.echoReplayTick++;
    if (this.state.echoReplayTick >= 100) {
      Object.values(this.state.players).forEach((p: any) => {
        p.isGhost = false;
        p.ghostReplayPath = null;
      });
      if (echoUser.gotEchoKill) {
        this.state.echoActive = false;
        this.state.echoUser = "";
        this.state.echoReplayTick = 0;
        echoUser.isEchoing = false;
        echoUser.gotEchoKill = false;
        this.broadcast("echo_end", { timeline: "continue" });
      } else {
        this.state.restoreEchoSnapshot();
        this.broadcast("echo_end", { timeline: "rollback" });
      }
    }
  }

  startRound() {
    this.state.round++;
    this.state.phase = "playing";
    let blueIdx = 0, redIdx = 0;
    for (const p of Object.values(this.state.players)) {
      p.alive = true; p.health = 100; p.ammo = 10;
      const spawnList = p.team === Team.Blue ? SPAWN_POINTS.Blue : SPAWN_POINTS.Red;
      const spawn = spawnList[p.team === Team.Blue ? blueIdx++ : redIdx++];
      p.x = spawn.x; p.y = spawn.y; p.z = spawn.z;
    }
    this.broadcast("round_start", { round: this.state.round });
    setTimeout(() => this.endRound(), 90000);
  }

  endRound() {
    this.state.phase = "ended";
    this.broadcast("round_end", {});
    setTimeout(() => this.startRound(), 5000);
  }

  update() {
    this.state.serverTick++;
    if (this.state.echoActive) {
      this.handleEchoReplay();
      return;
    }
    this.state.updatePlayers();
  }
}