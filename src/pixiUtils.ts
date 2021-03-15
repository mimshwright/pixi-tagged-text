import * as PIXI from "pixi.js";
import { TextStyleExtended } from "./types";

export const getFontString = (style: TextStyleExtended): string =>
  new PIXI.TextStyle(style).toFontString();

export const measureFont = (
  context: CanvasRenderingContext2D
): PIXI.IFontMetrics => PIXI.TextMetrics.measureFont(context.font);

const initialFontProps = {
  ascent: 10,
  descent: 3,
  fontSize: 13,
};

// TODO: Memoize
export const getFontPropertiesOfText = (
  textField: PIXI.Text,
  forceUpdate = false
): PIXI.IFontMetrics => {
  if (forceUpdate) {
    textField.updateText(false);
    return measureFont(textField.context);
  } else {
    const props = measureFont(textField.context);
    if (
      props.ascent === initialFontProps.ascent &&
      props.descent === initialFontProps.descent &&
      textField.style.fontSize > initialFontProps.fontSize
    ) {
      throw new Error(
        "getFontPropertiesOfText() returned metrics associated with a Text field that has not been updated yet. Please try using the forceUpdate parameter when you call this function. If you think this error is a mistake, wrap it in a try/catch block."
      );
    }
    return measureFont(textField.context);
  }
};
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
