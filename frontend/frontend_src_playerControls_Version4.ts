import { scene, camera } from "./scene";
import { sendMovement, sendShoot, sendAbility, sendEcho } from "./network";

let keys: Record<string, boolean> = {};
let mouseLocked = false;
let velocityY = 0;
let isCrouching = false;

export function setupControls() {
  window.addEventListener("keydown", (e) => keys[e.code] = true);
  window.addEventListener("keyup", (e) => keys[e.code] = false);

  scene.onPointerDown = (evt) => {
    if (!mouseLocked) {
      scene.getEngine().enterPointerlock();
      mouseLocked = true;
    } else if (evt.button === 0) {
      sendShoot();
    }
  };

  let pitch = 0, yaw = 0;
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === 1 && mouseLocked) {
      yaw -= pointerInfo.event.movementX * 0.002;
      pitch -= pointerInfo.event.movementY * 0.002;
      pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
    }
  });

  scene.registerBeforeRender(() => {
    let move = [0,0,0];
    const speed = isCrouching ? 0.08 : (keys["ShiftLeft"] ? 0.22 : 0.15);
    if (keys["KeyW"]) move[2] += 1;
    if (keys["KeyS"]) move[2] -= 1;
    if (keys["KeyA"]) move[0] -= 1;
    if (keys["KeyD"]) move[0] += 1;
    if (keys["Space"] && camera.position.y <= 2.01) velocityY = 0.18;
    if (keys["ControlLeft"]) isCrouching = true; else isCrouching = false;

    velocityY -= 0.01;
    camera.position.y += velocityY;
    if (camera.position.y < (isCrouching ? 1.3 : 2)) {
      camera.position.y = isCrouching ? 1.3 : 2;
      velocityY = 0;
    }

    let forward = [Math.sin(yaw), 0, Math.cos(yaw)];
    let right = [forward[2], 0, -forward[0]];
    camera.position.x += (move[0]*right[0] + move[2]*forward[0]) * speed;
    camera.position.z += (move[0]*right[2] + move[2]*forward[2]) * speed;
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    sendMovement(
      { x: camera.position.x, y: camera.position.y, z: camera.position.z, velocityY, isCrouching },
      { rotY: yaw, rotX: pitch }
    );
  });
}