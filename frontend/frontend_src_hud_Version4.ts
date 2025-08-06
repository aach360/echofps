import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from "babylonjs-gui";
export let hud = null;

export function createHUD() {
  hud = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  const healthBox = new Rectangle();
  healthBox.width = "120px";
  healthBox.height = "40px";
  healthBox.cornerRadius = 10;
  healthBox.color = "white";
  healthBox.thickness = 2;
  healthBox.background = "red";
  healthBox.top = "-40px";
  healthBox.left = "-45%";
  healthBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  healthBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  hud.addControl(healthBox);

  const healthText = new TextBlock();
  healthText.text = "Health: 100";
  healthText.color = "white";
  healthBox.addControl(healthText);

  // Add similar boxes for ammo, abilities, echo state as needed
}

export function updateHUD(health, ammo, abilities, echoState) {
  // Update Babylon GUI controls accordingly
}