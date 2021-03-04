import * as PIXI from "pixi.js";
import InteractionEvents from "./InteractionEvents";
import {
  TagBrackets,
  TagStyle,
  bbcodePropertyRegex,
  propertyRegex,
} from "./tags";
import {
  TextStyleExtended,
  TextStyleExtendedWithDefault,
  TextStyleSet,
  TextStyleSetWithDefault,
  MstDebugOptions,
  MstInteractionEvent,
  HitboxData,
  TextData,
  TagData,
  TextDrawingData,
  TextWithPrivateMembers,
} from "./types";

import { splitIntoLines, tokenize } from "./textUtils";
import { checkPixiVersion, getFontString, measureTextWidth } from "./pixiUtils";

("use strict");
checkPixiVersion(PIXI.VERSION, 5);

const WHITESPACE_REGEXP = /(\s\n\s)|(\s\n)|(\n\s)/g;

const presetStyles: TextStyleSet = {
  b: { fontStyle: "bold" },
  i: { fontStyle: "italic" },
  color: { fill: "" }, // an array would result in gradient
  outline: { stroke: "", strokeThickness: 6 },
  font: { fontFamily: "" },
  shadow: {
    dropShadowColor: "",
    dropShadow: true,
    dropShadowBlur: 3,
    dropShadowDistance: 3,
    dropShadowAngle: 2,
  },
  size: { fontSize: "px" },
  spacing: { letterSpacing: 0 },
  align: { align: "" },
};

export default class MultiStyleText extends PIXI.Text {
  private static DEFAULT_TagStyle: TextStyleExtendedWithDefault = {
    align: "left",
    breakWords: false,
    dropShadow: false,
    dropShadowAngle: Math.PI / 6,
    dropShadowBlur: 0,
    dropShadowColor: "#000000",
    dropShadowDistance: 5,
    fill: "black",
    fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
    fontFamily: "Arial",
    fontSize: 26,
    fontStyle: "normal",
    fontVariant: "normal",
    fontWeight: "normal",
    letterSpacing: 0,
    lineHeight: 0,
    lineSpacing: 0,
    lineJoin: "miter",
    miterLimit: 10,
    padding: 0,
    stroke: "black",
    strokeThickness: 0,
    textBaseline: "alphabetic",
    wordWrap: false,
    wordWrapWidth: 100,

    tagStyle: "xml",
    debug: false,
    valign: "baseline",
  };

  public static debugOptions: MstDebugOptions = {
    spans: {
      enabled: false,
      baseline: "#44BB44",
      top: "#BB4444",
      bottom: "#4444BB",
      bounding: "rgba(255, 255, 255, 0.1)",
      text: true,
    },
    objects: {
      enabled: false,
      bounding: "rgba(255, 255, 255, 0.05)",
      text: true,
    },
  };

  private _textStyles!: TextStyleSetWithDefault;

  public get textStyles(): TextStyleSetWithDefault {
    return this._textStyles;
  }

  public set textStyles(_: TextStyleSetWithDefault) {
    throw new Error("Don't set textStyles directly. Use setStyles()");
  }

  public get defaultTextStyle(): TextStyleExtendedWithDefault {
    return this.textStyles.default;
  }
  public set defaultTextStyle(style: TextStyleExtendedWithDefault) {
    this.textStyles.default = style;
  }

  private resetTextStyles() {
    this._textStyles = { default: { ...MultiStyleText.DEFAULT_TagStyle } };
  }
  private resetDefaultStyle() {
    this.defaultTextStyle = { ...MultiStyleText.DEFAULT_TagStyle };
  }

  public setStyles(styles: TextStyleSetWithDefault): void {
    this.resetTextStyles();

    this.setTagStyles(styles);

    // todo: Should we make this work for html style tags too? Why just for BBCode?
    // todo: original code had these overwriting the styles you just set. Is that on purpose?
    if (this.textStyles.default.tagStyle === TagStyle.bbcode) {
      // when using bbcode parsing, register a bunch of standard bbcode tags and some cool pixi ones
      this.setTagStyles(presetStyles, true);
    }
  }

  private setDirty(dirty = true) {
    this.withPrivateMembers().dirty = dirty;
  }

  private getDirty(): boolean {
    return this.withPrivateMembers().dirty;
  }

  private setRootDefaultStyle(style: TextStyleExtended) {
    this.withPrivateMembers()._style = new PIXI.TextStyle(style);
  }

  private getRootDefaultStyle(): PIXI.TextStyle {
    return this.withPrivateMembers()._style;
  }

  private updateRootDefaultStyle() {
    this.setRootDefaultStyle(this.defaultTextStyle);
  }

  private getTexture() {
    return this.withPrivateMembers()._texture;
  }

  private generateFillStyle(style: PIXI.TextStyle, lines: string[]) {
    return this.withPrivateMembers()._generateFillStyle(style, lines);
  }

  private hitboxes: HitboxData[] = [];
  private resetHitboxes() {
    this.hitboxes = [];
  }

  /////
  /// CONSTRUCTOR
  /////

  constructor(text: string, styles: TextStyleSetWithDefault) {
    super(text);

    this.setStyles(styles);

    this.initEvents();
  }

  // Tricks TypeScript into letting us access the private members of the parent class.
  private withPrivateMembers(): TextWithPrivateMembers {
    return (this as unknown) as TextWithPrivateMembers;
  }

  ///////////
  ///////////

  private initEvents() {
    const migrateEvent = (e: PIXI.InteractionEvent) =>
      this.handleInteraction(e);

    InteractionEvents.forEach((event) => {
      this.on(event, migrateEvent);
    });
  }

  private handleInteraction(e: PIXI.InteractionEvent) {
    const ev = e as MstInteractionEvent;

    const localPoint = e.data.getLocalPosition(this);
    const targetTag = this.hitboxes.reduce(
      (prev: HitboxData | undefined, hitbox: HitboxData) => {
        if (prev !== undefined) {
          return prev;
        }
        if (hitbox.hitbox.contains(localPoint.x, localPoint.y)) {
          return hitbox;
        }
        return undefined;
      },
      undefined
    );
    ev.targetTag = targetTag === undefined ? undefined : targetTag.tag;
  }

  /////

  public setTagStyle(
    tagName: string,
    style: TextStyleExtended,
    overwrite = false
  ): void {
    // if the tag name is "default", merge it and update underlying
    if (tagName === "default") {
      this.defaultTextStyle = { ...this.defaultTextStyle, ...style };
      this.updateRootDefaultStyle();
    } else {
      let previousStyle = {};
      if (tagName in this.textStyles && overwrite === false) {
        previousStyle = this.textStyles[tagName];
      }
      this.textStyles[tagName] = { ...previousStyle, ...style };
    }
    this.setDirty(true);
  }

  public setTagStyles(styles: TextStyleSet, overwrite = false): void {
    for (const styleName in styles) {
      this.setTagStyle(styleName, styles[styleName], overwrite);
    }
  }

  public deleteTagStyle(tagName: string): void {
    if (tagName === "default") {
      this.defaultTextStyle = { ...MultiStyleText.DEFAULT_TagStyle };
      this.updateRootDefaultStyle();
    } else {
      delete this.textStyles[tagName];
    }
  }

  /////

  private getTagRegex(captureName: boolean, captureMatch: boolean): RegExp {
    let tagAlternation = Object.keys(this.textStyles).join("|");
    const { tagStyle } = this.defaultTextStyle;

    if (captureName) {
      tagAlternation = `(${tagAlternation})`;
    } else {
      tagAlternation = `(?:${tagAlternation})`;
    }

    let pattern;
    if (tagStyle === TagStyle.bbcode) {
      const [openTag, closeTag] = TagBrackets.bbcode;
      pattern = `\\${openTag}${tagAlternation}(?:\\=(?:[A-Za-z0-9_\\-\\#]+|'(?:[^']+|\\\\')*'))*\\s*\\${closeTag}|\\${openTag}\\/${tagAlternation}\\s*\\${closeTag}`;
    } else {
      const [openTag, closeTag] = TagBrackets.xml;
      pattern = `\\${openTag}${tagAlternation}(?:\\s+[A-Za-z0-9_\\-]+=(?:"(?:[^"]+|\\\\")*"|'(?:[^']+|\\\\')*'))*\\s*\\${closeTag}|\\${openTag}\\/${tagAlternation}\\s*\\${closeTag}`;
    }

    if (captureMatch) {
      pattern = `(${pattern})`;
    }

    return new RegExp(pattern, "g");
  }

  private getTextDataPerLine(str: string) {
    const stringLines = splitIntoLines(str);
    const lines: TextData[][] = [];
    const re = this.getTagRegex(true, false);

    const styleStack = [{ ...this.defaultTextStyle }];
    const tagStack: TagData[] = [{ name: "default", properties: {} }];

    // determine the group of word for each line
    for (let lineIndex = 0; lineIndex < stringLines.length; lineIndex++) {
      const stringLine = stringLines[lineIndex];
      const line: TextData[] = [];

      // find tags inside the string
      const matches: RegExpExecArray[] = [];
      let matchArray: RegExpExecArray | null;

      while ((matchArray = re.exec(stringLine))) {
        matches.push(matchArray);
      }

      // if there is no match, we still need to add the line with the default style
      if (matches.length === 0) {
        line.push(
          createTextData(
            stringLines[lineIndex],
            styleStack[styleStack.length - 1],
            tagStack[tagStack.length - 1]
          )
        );
      } else {
        // We got a match! add the text with the needed style
        let currentSearchIdx = 0;
        for (let j = 0; j < matches.length; j++) {
          // if index > 0, it means we have characters before the match,
          // so we need to add it with the default style
          if (matches[j].index > currentSearchIdx) {
            line.push(
              createTextData(
                stringLines[lineIndex].substring(
                  currentSearchIdx,
                  matches[j].index
                ),
                styleStack[styleStack.length - 1],
                tagStack[tagStack.length - 1]
              )
            );
          }

          if (matches[j][0][1] === "/") {
            // reset the style if end of tag
            if (styleStack.length > 1) {
              styleStack.pop();
              tagStack.pop();
            }
          } else {
            // set the current style
            const properties: { [key: string]: string } = {};
            let propertyMatch: RegExpMatchArray | null;

            while ((propertyMatch = propertyRegex.exec(matches[j][0]))) {
              properties[propertyMatch[1]] =
                propertyMatch[2] || propertyMatch[3];
            }

            tagStack.push({ name: matches[j][1], properties });

            const { tagStyle } = this.defaultTextStyle;
            // if using bbtag style, take styling information in a different way
            if (
              tagStyle === TagStyle.bbcode &&
              matches[j][0].includes("=") &&
              this.textStyles[matches[j][1]]
            ) {
              const bbcodeTags = bbcodePropertyRegex.exec(matches[j][0]);
              const bbStyle: { [key: string]: string | number } = {};

              const textStylesAsArray = Object.entries(
                this.textStyles[matches[j][1]]
              );
              textStylesAsArray.forEach(([styleName, styleRules]) => {
                if (typeof styleRules === "string" && bbcodeTags !== null) {
                  bbStyle[styleName] = bbcodeTags[1] + styleRules;
                } else if (
                  typeof styleRules === "number" &&
                  bbcodeTags !== null
                ) {
                  bbStyle[styleName] = Number(bbcodeTags[1]) || styleRules;
                } else {
                  bbStyle[styleName] = styleRules;
                }
              });

              styleStack.push({
                ...styleStack[styleStack.length - 1],
                ...bbStyle,
              });
            } else {
              styleStack.push({
                ...styleStack[styleStack.length - 1],
                ...this.textStyles[matches[j][1]],
              });
            }
          }

          // update the current search index
          currentSearchIdx = matches[j].index + matches[j][0].length;
        }

        // is there any character left?
        if (currentSearchIdx < stringLines[lineIndex].length) {
          const result = createTextData(
            currentSearchIdx
              ? stringLines[lineIndex].substring(currentSearchIdx)
              : stringLines[lineIndex],
            styleStack[styleStack.length - 1],
            tagStack[tagStack.length - 1]
          );
          line.push(result);
        }
      }

      lines.push(line);
    }

    // don't display any incomplete tags at the end of text- good for scrolling text in games
    const { tagStyle } = this.defaultTextStyle;
    lines[lines.length - 1].map((data) => {
      if (data.text.includes(TagBrackets[tagStyle][0])) {
        let pattern;
        if (tagStyle === TagStyle.bbcode) {
          pattern = /^(.*)\[/;
        } else {
          pattern = /^(.*)</;
        }
        const matches = data.text.match(pattern);
        if (matches) {
          data.text = matches[1];
        }
      }
    });

    return lines;

    // internal functions
    function createTextData(
      text: string,
      style: TextStyleExtended,
      tag: TagData
    ): TextData {
      return {
        text,
        style,
        width: 0,
        height: 0,
        fontProperties: { ascent: 0, descent: 0, fontSize: 0 },
        tag,
      };
    }
  }

  private getDropShadowPadding(): number {
    let maxDistance = 0;
    let maxBlur = 0;

    Object.keys(this.textStyles).forEach((styleKey) => {
      const { dropShadowDistance, dropShadowBlur } = this.textStyles[styleKey];
      maxDistance = Math.max(maxDistance, dropShadowDistance || 0);
      maxBlur = Math.max(maxBlur, dropShadowBlur || 0);
    });

    return maxDistance + maxBlur;
  }

  public updateText(): void {
    if (this.getDirty() === false) {
      return;
    }

    // prep
    this.resetHitboxes();

    this.texture.baseTexture.resolution = this.resolution;
    const textStyles = this.textStyles;

    // Calculate word wrap
    const wrappedText = this.calculateWordWrap(this.text);

    // Calculate text style data for each line
    const textDataLines = this.getTextDataPerLine(wrappedText);

    // Measure each line
    // Calculate drawing data for each line
    // Draw the component (4 passes)
    //   0. Draw shadows
    //   1. Draw strokes
    //   2. Draw fills
    //   3. Draw Debug info
    // Update the texture

    // calculate text width and height
    const lineWidths: number[] = [];
    const lineYMins: number[] = [];
    const lineYMaxs: number[] = [];
    let maxLineWidth = 0;
    const lineSpacing = textStyles["default"].lineSpacing;

    for (let lineIndex = 0; lineIndex < textDataLines.length; lineIndex++) {
      const line = textDataLines[lineIndex];

      let lineWidth = 0;
      let lineYMin = 0;
      let lineYMax = 0;

      for (
        let textDataIndex = 0;
        textDataIndex < line.length;
        textDataIndex++
      ) {
        const textData = line[textDataIndex];
        const sty = textData.style;
        const ls = sty.letterSpacing || 0;

        this.context.font = getFontString(sty);

        // save the width
        textData.width = measureTextWidth(this.context, textData.text);

        if (textData.text.length !== 0) {
          textData.width += (textData.text.length - 1) * ls;

          if (textDataIndex > 0) {
            lineWidth += ls / 2; // spacing before first character
          }

          if (textDataIndex < textDataLines[lineIndex].length - 1) {
            lineWidth += ls / 2; // spacing after last character
          }
        }

        lineWidth += textData.width;

        // save the font properties
        textDataLines[lineIndex][
          textDataIndex
        ].fontProperties = PIXI.TextMetrics.measureFont(this.context.font);

        // save the height
        textData.height = textData.fontProperties.fontSize;

        if (typeof sty.valign === "number") {
          lineYMin = Math.min(
            lineYMin,
            sty.valign - textData.fontProperties.descent
          );
          lineYMax = Math.max(
            lineYMax,
            sty.valign + textData.fontProperties.ascent
          );
        } else {
          lineYMin = Math.min(lineYMin, -textData.fontProperties.descent);
          lineYMax = Math.max(lineYMax, textData.fontProperties.ascent);
        }
      } // end text data loop

      lineWidths[lineIndex] = lineWidth;
      lineYMins[lineIndex] = lineYMin;
      lineYMaxs[lineIndex] = lineYMax;

      if (lineIndex > 0 && lineSpacing) {
        lineYMaxs[lineIndex] += lineSpacing;
      }

      maxLineWidth = Math.max(maxLineWidth, lineWidth);
    } // end line loop

    // transform styles in array
    const stylesArray = Object.keys(textStyles).map((key) => textStyles[key]);

    const maxStrokeThickness = stylesArray.reduce(
      (prev, cur) => Math.max(prev, cur.strokeThickness || 0),
      0
    );

    const dropShadowPadding = this.getDropShadowPadding();

    const totalHeight =
      lineYMaxs.reduce((prev, cur) => prev + cur, 0) -
      lineYMins.reduce((prev, cur) => prev + cur, 0);

    // define the right width and height
    const width = maxLineWidth + 2 * maxStrokeThickness + 2 * dropShadowPadding;
    const height = totalHeight + 2 * maxStrokeThickness + 2 * dropShadowPadding;

    this.canvas.width = width * this.resolution;
    this.canvas.height = height * this.resolution;

    this.context.scale(this.resolution, this.resolution);

    this.context.textBaseline = "alphabetic";
    this.context.lineJoin = "round";

    let basePositionY = dropShadowPadding + maxStrokeThickness;

    const drawingData: TextDrawingData[] = [];

    // Compute the drawing data
    for (let lineIndex = 0; lineIndex < textDataLines.length; lineIndex++) {
      const line = textDataLines[lineIndex];
      let linePositionX: number;

      switch (this.getRootDefaultStyle().align) {
        case "center":
          linePositionX =
            dropShadowPadding +
            maxStrokeThickness +
            (maxLineWidth - lineWidths[lineIndex]) / 2;
          break;
        case "right":
          linePositionX =
            dropShadowPadding +
            maxStrokeThickness +
            maxLineWidth -
            lineWidths[lineIndex];
          break;
        case "left":
        default:
          linePositionX = dropShadowPadding + maxStrokeThickness;
          break;
      }

      for (
        let textDataIndex = 0;
        textDataIndex < line.length;
        textDataIndex++
      ) {
        const textData = line[textDataIndex];
        const { style, text, fontProperties, width, tag } = textData;
        const ls = style.letterSpacing || 0;

        let linePositionY = basePositionY + fontProperties.ascent;

        switch (style.valign) {
          case "top":
            // no need to do anything
            break;

          case "baseline":
            linePositionY += lineYMaxs[lineIndex] - fontProperties.ascent;
            break;

          case "middle":
            linePositionY +=
              (lineYMaxs[lineIndex] -
                lineYMins[lineIndex] -
                fontProperties.ascent -
                fontProperties.descent) /
              2;
            break;

          case "bottom":
            linePositionY +=
              lineYMaxs[lineIndex] -
              lineYMins[lineIndex] -
              fontProperties.ascent -
              fontProperties.descent;
            break;

          default:
            // A number - offset from baseline, positive is higher
            linePositionY +=
              lineYMaxs[lineIndex] -
              fontProperties.ascent -
              (style.valign || 0);
            break;
        }

        if (ls === 0) {
          drawingData.push({
            text,
            style,
            x: linePositionX,
            y: linePositionY,
            width,
            ascent: fontProperties.ascent,
            descent: fontProperties.descent,
            tag,
          });

          linePositionX += textData.width;
        } else {
          this.context.font = getFontString(textData.style);

          for (let charIndex = 0; charIndex < text.length; charIndex++) {
            if (charIndex > 0 || textDataIndex > 0) {
              linePositionX += ls / 2;
            }

            const charWidth = measureTextWidth(
              this.context,
              text.charAt(charIndex)
            );

            drawingData.push({
              text: text.charAt(charIndex),
              style,
              x: linePositionX,
              y: linePositionY,
              width: charWidth,
              ascent: fontProperties.ascent,
              descent: fontProperties.descent,
              tag,
            });

            linePositionX += charWidth;

            if (
              charIndex < text.length - 1 ||
              textDataIndex < line.length - 1
            ) {
              linePositionX += ls / 2;
            }
          }
        }
      } // end computeDrawingData textData loop

      basePositionY += lineYMaxs[lineIndex] - lineYMins[lineIndex];
    } // end computeDrawingData line loop

    this.context.save();

    // First pass: draw the shadows only
    drawingData.forEach(({ style, text, x, y }) => {
      if (!style.dropShadow) {
        return; // This text doesn't have a shadow
      }

      this.context.font = getFontString(style);

      let dropFillStyle = style.dropShadowColor || 0;
      if (typeof dropFillStyle === "number") {
        dropFillStyle = PIXI.utils.hex2string(dropFillStyle);
      }
      const blur = style.dropShadowBlur || 0;
      const angle = style.dropShadowAngle || 0;
      const distance = style.dropShadowDistance || 0;
      this.context.shadowColor = dropFillStyle;
      this.context.shadowBlur = blur;
      this.context.shadowOffsetX = Math.cos(angle) * distance * this.resolution;
      this.context.shadowOffsetY = Math.sin(angle) * distance * this.resolution;

      this.context.fillText(text, x, y);
    });

    this.context.restore();

    // Second pass: draw the strokes only
    drawingData.forEach(({ style, text, x, y }) => {
      if (style.stroke === undefined || !style.strokeThickness) {
        return; // Skip this step if we have no stroke
      }

      this.context.font = getFontString(style);

      let strokeStyle = style.stroke;
      if (typeof strokeStyle === "number") {
        strokeStyle = PIXI.utils.hex2string(strokeStyle);
      }

      this.context.strokeStyle = strokeStyle;
      this.context.lineWidth = style.strokeThickness;

      this.context.strokeText(text, x, y);
    });

    // Third pass: draw the fills only
    drawingData.forEach(({ style, text, x, y }) => {
      if (style.fill === undefined) {
        return; // Skip this step if we have no fill
      }

      this.context.font = getFontString(style);

      // set canvas text styles
      let fillStyle = style.fill;
      if (typeof fillStyle === "number") {
        fillStyle = PIXI.utils.hex2string(fillStyle);
      } else if (Array.isArray(fillStyle)) {
        for (let i = 0; i < fillStyle.length; i++) {
          const fill = fillStyle[i];
          if (typeof fill === "number") {
            fillStyle[i] = PIXI.utils.hex2string(fill);
          }
        }
      }
      this.context.fillStyle = this.generateFillStyle(
        new PIXI.TextStyle(style),
        [text]
      ) as string | CanvasGradient;
      // Typecast required for proper typechecking

      this.context.fillText(text, x, y);
    });

    // Fourth pass: collect the bounding boxes and draw the debug information
    drawingData.forEach(({ style, x, y, width, ascent, descent, tag }) => {
      const offset =
        -this.getRootDefaultStyle().padding - this.getDropShadowPadding();

      this.hitboxes.push({
        tag,
        hitbox: new PIXI.Rectangle(
          x + offset,
          y - ascent + offset,
          width,
          ascent + descent
        ),
      });

      const debugSpan =
        style.debug === undefined
          ? MultiStyleText.debugOptions.spans.enabled
          : style.debug;

      if (debugSpan) {
        this.context.lineWidth = 1;

        if (MultiStyleText.debugOptions.spans.bounding) {
          this.context.fillStyle = MultiStyleText.debugOptions.spans.bounding;
          this.context.strokeStyle = MultiStyleText.debugOptions.spans.bounding;
          this.context.beginPath();
          this.context.rect(x, y - ascent, width, ascent + descent);
          this.context.fill();
          this.context.stroke();
          this.context.stroke(); // yes, twice
        }

        if (MultiStyleText.debugOptions.spans.baseline) {
          this.context.strokeStyle = MultiStyleText.debugOptions.spans.baseline;
          this.context.beginPath();
          this.context.moveTo(x, y);
          this.context.lineTo(x + width, y);
          this.context.closePath();
          this.context.stroke();
        }

        if (MultiStyleText.debugOptions.spans.top) {
          this.context.strokeStyle = MultiStyleText.debugOptions.spans.top;
          this.context.beginPath();
          this.context.moveTo(x, y - ascent);
          this.context.lineTo(x + width, y - ascent);
          this.context.closePath();
          this.context.stroke();
        }

        if (MultiStyleText.debugOptions.spans.bottom) {
          this.context.strokeStyle = MultiStyleText.debugOptions.spans.bottom;
          this.context.beginPath();
          this.context.moveTo(x, y + descent);
          this.context.lineTo(x + width, y + descent);
          this.context.closePath();
          this.context.stroke();
        }

        if (MultiStyleText.debugOptions.spans.text) {
          this.context.fillStyle = "#ffffff";
          this.context.strokeStyle = "#000000";
          this.context.lineWidth = 2;
          this.context.font = "8px monospace";
          this.context.strokeText(tag.name, x, y - ascent + 8);
          this.context.fillText(tag.name, x, y - ascent + 8);
          this.context.strokeText(
            `${width.toFixed(2)}x${(ascent + descent).toFixed(2)}`,
            x,
            y - ascent + 16
          );
          this.context.fillText(
            `${width.toFixed(2)}x${(ascent + descent).toFixed(2)}`,
            x,
            y - ascent + 16
          );
        }
      }
    });

    if (MultiStyleText.debugOptions.objects.enabled) {
      if (MultiStyleText.debugOptions.objects.bounding) {
        this.context.fillStyle = MultiStyleText.debugOptions.objects.bounding;
        this.context.beginPath();
        this.context.rect(0, 0, width, height);
        this.context.fill();
      }

      if (MultiStyleText.debugOptions.objects.text) {
        this.context.fillStyle = "#ffffff";
        this.context.strokeStyle = "#000000";
        this.context.lineWidth = 2;
        this.context.font = "8px monospace";
        this.context.strokeText(
          `${width.toFixed(2)}x${height.toFixed(2)}`,
          0,
          8,
          width
        );
        this.context.fillText(
          `${width.toFixed(2)}x${height.toFixed(2)}`,
          0,
          8,
          width
        );
      }
    }

    this.updateTexture();
  }

  protected calculateWordWrap(text: string): string {
    // Greedy wrapping algorithm that will wrap words as the line grows longer than its horizontal bounds.

    const style = this.getRootDefaultStyle();

    if (style.wordWrap !== true) {
      return text;
    }

    let wrappedText = "";
    const tagPattern = this.getTagRegex(true, true);

    const lines = text.split("\n");
    const { wordWrapWidth, letterSpacing } = style;

    const styleStack = [{ ...this.defaultTextStyle }];
    this.context.font = getFontString(this.textStyles["default"]);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const tagSplit = line.split(tagPattern);
      let firstWordOfLine = true;

      let spaceLeft = wordWrapWidth;

      for (let tagIndex = 0; tagIndex < tagSplit.length; tagIndex++) {
        const tag: string = tagSplit[tagIndex];

        if (tagPattern.test(tag)) {
          wrappedText += tag;
          if (tag[1] === "/") {
            tagIndex += 2;
            styleStack.pop();
          } else {
            tagIndex++;
            styleStack.push({
              ...styleStack[styleStack.length - 1],
              ...this.textStyles[tag],
            });
            tagIndex++;
          }
          this.context.font = getFontString(styleStack[styleStack.length - 1]);
        } else {
          const words = tokenize(tag);

          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            let cw = 0;
            if (letterSpacing > 0) {
              const chars = word.split("");
              for (let charIndex = 0; charIndex < chars.length; charIndex++) {
                const char = chars[charIndex];
                cw += measureTextWidth(this.context, char) + letterSpacing;
              }
            } else {
              cw = measureTextWidth(this.context, word);
            }
            const wordWidth = cw;

            if (style.breakWords && wordWidth > spaceLeft) {
              // Part should be split in the middle
              const characters = word.split("");

              for (
                let charIndex = 0;
                charIndex < characters.length;
                charIndex++
              ) {
                const char = characters[charIndex];
                const characterWidth =
                  measureTextWidth(this.context, char) + letterSpacing;

                if (characterWidth > spaceLeft) {
                  wrappedText += `\n${char}`;
                  spaceLeft = wordWrapWidth - characterWidth;
                } else {
                  wrappedText += char;
                  spaceLeft -= characterWidth;
                }
              }
            } else if (style.breakWords) {
              wrappedText += word;
              spaceLeft -= wordWidth;
            } else {
              const paddedWordWidth = wordWidth + letterSpacing;

              if (paddedWordWidth > spaceLeft) {
                // Skip printing the newline if it's the first word of the line that is
                // greater than the word wrap width.
                if (!firstWordOfLine) {
                  wrappedText += "\n";
                }

                wrappedText += word;
                spaceLeft = wordWrapWidth - wordWidth;
              } else {
                spaceLeft -= paddedWordWidth;
                wrappedText += word;
              }
            }
            firstWordOfLine = false;
          }
        }
      }

      // Unless this is the last line, add a new line to your output.
      if (lineIndex < lines.length - 1) {
        wrappedText += "\n";
      }
    }

    // Remove whitespace before and after each line break.
    wrappedText = wrappedText.replace(WHITESPACE_REGEXP, "\n");
    return wrappedText;
  }

  protected updateTexture(): void {
    const texture = this.getTexture();
    const PADDING = this.getRootDefaultStyle().padding;
    const DROP_SHADOW_PADDING = this.getDropShadowPadding();
    const { canvas, resolution: RESOLUTION } = this;
    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = canvas;
    const TRIM = PADDING + DROP_SHADOW_PADDING;

    texture.baseTexture.setRealSize(CANVAS_WIDTH, CANVAS_HEIGHT, RESOLUTION);
    texture.trim.width = texture.frame.width = CANVAS_WIDTH / RESOLUTION;
    texture.trim.height = texture.frame.height = CANVAS_HEIGHT / RESOLUTION;

    texture.trim.x = -TRIM;
    texture.trim.y = -TRIM;

    texture.orig.width = texture.frame.width - TRIM * 2;
    texture.orig.height = texture.frame.height - TRIM * 2;

    // call sprite onTextureUpdate to update scale if _width or _height were set
    this.withPrivateMembers()._onTextureUpdate();

    texture.baseTexture.emit("update", texture.baseTexture);

    this.setDirty(false);
  }
}
