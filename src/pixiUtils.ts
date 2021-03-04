import { TextStyleExtended } from "./types";
import * as PIXI from "pixi.js";

export const getFontString = (style: TextStyleExtended): string =>
  new PIXI.TextStyle(style).toFontString();

export const measureTextWidth = (
  context: CanvasRenderingContext2D,
  text: string
): number => context.measureText(text).width;

export const checkPixiVersion = (
  version: string,
  minimumVersion: number
): number => {
  const majorVersion = parseInt(version.split(".")[0], 10);
  if (majorVersion < minimumVersion) {
    throw new Error(
      `Detected Pixi.js version ${PIXI.VERSION}. pixi-multistyle-text supports Pixi.js version 5+. (Please use v0.8.0 for Pixi 4 support.)`
    );
    return 1;
  }
  return 0;
};
