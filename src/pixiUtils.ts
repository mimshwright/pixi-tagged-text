import { TextStyleExtended } from "./types";
import * as PIXI from "pixi.js";

export const getFontString = (style: TextStyleExtended): string =>
  new PIXI.TextStyle(style).toFontString();

export const measureFont = (
  context: CanvasRenderingContext2D
): PIXI.IFontMetrics => PIXI.TextMetrics.measureFont(context.font);

/**
 * Shortcut function for getting text metrix data from a text string in the current context.
 */
export const measureText = (
  context: CanvasRenderingContext2D,
  text: string
): TextMetrics => context.measureText(text);

/**
 * Shortcut function for getting text width from a text string in the current context.
 */
export const measureTextWidth = (
  context: CanvasRenderingContext2D,
  text: string
): number => measureText(context, text).width;

export const checkPixiVersion = (
  version: string,
  expectedMajorVersion: number
): number => {
  const majorVersion = parseInt(version.split(".")[0], 10);
  if (majorVersion !== expectedMajorVersion) {
    throw new Error(
      `Detected Pixi.js version ${PIXI.VERSION}. pixi-multistyle-text supports Pixi.js version ${expectedMajorVersion}. (Please use v0.8.0 of this package for Pixi 4 support.)`
    );
  }
  return 0;
};
