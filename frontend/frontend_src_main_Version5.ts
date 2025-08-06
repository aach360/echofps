import { scene, camera, engine, showEchoEffect, hideEchoEffect } from "./scene";
import { joinMatch, room } from "./network";
import { setupControls } from "./playerControls";
import { createHUD, updateHUD } from "./hud";

async function main() {
  await joinMatch();
  setupControls();
  createHUD();

  room.onMessage("death", ({ victim, killer }) => {
    if (room.sessionId === victim) alert("You died!");
  });
  room.onMessage("echo", ({ user }) => {
    if (user === room.sessionId) showEchoEffect();
    else hideEchoEffect();
  });
  room.onMessage("echo_end", ({ timeline }) => {
    hideEchoEffect();
  });
  room.onMessage("ability", ({ user, ability, effect, pos, center }) => {
    // TODO: VFX for abilities
  });

  engine.runRenderLoop(() => {
    scene.render();
    // TODO: Call updateHUD with latest health/ammo/cooldowns
  });
}

main();