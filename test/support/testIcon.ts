import * as PIXI from "pixi.js";
import iconSrc from "./icon.base64";

const W = 128;
const H = 128;

export const createImage = (
  base64Source: string = iconSrc
): HTMLImageElement => {
  const ICON_SRC = `data:image/png;base64,${base64Source}`;
  const img = new Image();
  img.src = ICON_SRC;
  img.width = W;
  img.height = H;
  return img;
};

export const createTexture = (
  src = createImage(),
  width = W,
  height = H
): PIXI.Texture =>
  PIXI.Texture.from(src, {
    width,
    height,
  });
export const createSprite = (
  texture: PIXI.Texture = createTexture()
): PIXI.Sprite => new PIXI.Sprite(texture);

export const iconImage = createImage(iconSrc);
export const iconTexture = createTexture(iconImage);
export const icon = createSprite(iconTexture);
