import * as PIXI from "pixi.js";
import iconSrc from "./icon.base64";

const ICON_SRC = `data:image/png;base64,${iconSrc}`;
const img = new Image();
img.src = ICON_SRC;
img.width = 128;
img.height = 128;

export const iconImage = img;

export const iconTexture = PIXI.Texture.from(iconImage, {
  width: 128,
  height: 128,
});

export const icon = PIXI.Sprite.from(iconTexture);
