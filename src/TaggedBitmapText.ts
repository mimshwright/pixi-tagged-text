import TaggedText from "./TaggedText";
import * as PIXI from "pixi.js";
import { TextStyleExtended } from "./types";
import { fontSizeStringToNumber } from "./pixiUtils";
import DEFAULT_STYLE from "./defaultStyle";

export default class TaggedBitmapText extends TaggedText<PIXI.BitmapText> {
  protected override createTextField(
    text: string,
    style: TextStyleExtended
  ): PIXI.BitmapText {
    const convertedStyle = this.convertTextStyleToBitmapTextStyle(
      style
    ) as Partial<PIXI.IBitmapTextStyle>;
    return new PIXI.BitmapText(text, convertedStyle);
  }

  /**
   * Set which `IBitmapTextStyle` are dynamically configured from the `ITextStyle` on BitmapText, overriding the defaults from `PIXI.BitmapFont`.
   *
   * For example if you generated a font at 128px, you might set `{ fontSize: 64 }`.
   *
   * By default, the following attributes are automatically mapped to their best equivalents: 'align', 'fontSize', 'fill', 'letterSpacing', and 'wordWrapWidth'.
   */
  protected convertTextStyleToBitmapTextStyle(
    style: TextStyleExtended
  ): TextStyleExtended {
    return {
      ...style,
      fontSize: fontSizeStringToNumber(
        style.fontSize ?? (DEFAULT_STYLE.fontSize as number)
      ),
      maxWidth: style.maxWidth ?? style.wordWrapWidth ?? undefined,
      tint: (style.tint ?? style.color ?? style.fill) as number, // NOTE: Color types are different in different versions of PIXI 6 and PIXI 7+.
    };
  }
}
