import * as PIXI from "pixi.js";
import iconSrc from "./icon.base64";
import iconSrcDestroy from "./icon-destroy.base64";

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

const ICON_SRC_DESTROYABLE = `data:image/png;base64,${iconSrcDestroy}`;
const imgDestroy = new Image();
imgDestroy.src = ICON_SRC_DESTROYABLE;
imgDestroy.width = 128;
imgDestroy.height = 128;

export const destroyableIconTexture = PIXI.Texture.from(imgDestroy, {
  width: 128,
  height: 128,
});
