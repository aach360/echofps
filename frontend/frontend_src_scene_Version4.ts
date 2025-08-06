import { Engine, Scene, UniversalCamera, Vector3, HemisphericLight, MeshBuilder, Color3 } from "babylonjs";
export const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
export const engine = new Engine(canvas, true);
export const scene = new Scene(engine);

export const camera = new UniversalCamera("FPSCamera", new Vector3(0, 2, -10), scene);
camera.attachControl(canvas, true);
camera.inertia = 0.2;

const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);

export function showEchoEffect() {
  scene.clearColor = new Color3(0.2, 0.2, 0.3);
}
export function hideEchoEffect() {
  scene.clearColor = new Color3(0.05, 0.05, 0.07);
}