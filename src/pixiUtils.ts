import { TextStyleExtended } from "./types";
import * as PIXI from "pixi.js";

export const getFontString = (style: TextStyleExtended): string =>  new PIXI.TextStyle(style).toFontString();
