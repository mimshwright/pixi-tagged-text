import { TextStyleExtended } from "./types";
import * as PIXI from "pixi.js";

export const getFontString = (style: TextStyleExtended): string =>
  new PIXI.TextStyle(style).toFontString();

export const measureTextWidth = (
  context: CanvasRenderingContext2D,
  text: string
): number => context.measureText(text).width;
