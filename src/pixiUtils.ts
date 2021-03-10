import { TextStyleExtended } from "./types";
import * as PIXI from "pixi.js";

export const getFontString = (style: TextStyleExtended): string =>
  new PIXI.TextStyle(style).toFontString();

export const measureFont = (
  context: CanvasRenderingContext2D
): PIXI.IFontMetrics => PIXI.TextMetrics.measureFont(context.font);

export const measureTextWidth = (
  context: CanvasRenderingContext2D,
  text: string
): number => context.measureText(text).width;

export const checkPixiVersion = (
  version: string,
  expectedMajorVersion: number
): number => {
  const majorVersion = parseInt(version.split(".")[0], 10);
  if (majorVersion !== expectedMajorVersion) {
    throw new Error(
      `Detected Pixi.js version ${PIXI.VERSION}. pixi-multistyle-text supports Pixi.js version 5. (Please use v0.8.0 for Pixi 4 support.)`
    );
  }
  return 0;
};
