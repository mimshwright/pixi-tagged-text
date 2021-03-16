import * as PIXI from "pixi.js";
import { parseTags, removeTags } from "./tags";
import {
  RichTextOptions,
  TextStyleSet,
  TextStyleExtended,
  TaggedTextToken,
  TagWithAttributes,
  AttributesList,
  TaggedTextTokenComplete,
} from "./types";
import { calculateMeasurements } from "./layout";
import {
  combineAllStyles,
  getStyleForTag as getStyleForTagExt,
  getStyleForToken,
} from "./style";

const DEFAULT_STYLE: TextStyleExtended = {
  align: "left",
  valign: "baseline",
  wordWrap: true,
  wordWrapWidth: 500,
};

const DEFAULT_OPTIONS: RichTextOptions = {
  debug: false,
  splitStyle: "words",
};

const DEBUG = {
  WORD_STROKE_COLOR: 0x00ff00,
  WORD_FILL_COLOR: 0xff00ff,
  BASELINE_COLOR: 0x0033cc,
  LINE_COLOR: 0xffff00,
  OUTLINE_COLOR: 0xffcccc,
  OUTLINE_SHADOW_COLOR: 0x000000,
  TEXT_STYLE: {
    fontFamily: "courier",
    fontSize: 10,
    fill: 0xffffff,
    dropShadow: true,
  },
};

export default class RichText extends PIXI.Sprite {
  constructor(
    text = "",
    tagStyles: TextStyleSet = {},
    options: RichTextOptions = {},
    texture?: PIXI.Texture
  ) {
    super(texture);

    this._debugContainer = new PIXI.Container();
    if (options.debug) {
      this.addChild(this._debugContainer);
    }

    this._textContainer = new PIXI.Container();
    this.addChild(this.textContainer);

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    this.options = mergedOptions;

    const mergedDefaultStyles = { ...DEFAULT_STYLE, ...tagStyles.default };
    tagStyles.default = mergedDefaultStyles;
    this.tagStyles = tagStyles;

    this.text = text;
  }

  private options: RichTextOptions;

  private animationRequest = NaN;

  private _text = "";
  public get text(): string {
    return this._text;
  }
  public set text(text: string) {
    // Todo: check for deep equality.
    // const changed = this._text !== text;
    this._text = text;

    // if (changed) {
    this.update();
    // }
  }
  public get untaggedText(): string {
    return removeTags(this.text);
  }

  private _tagStyles: TextStyleSet = {};
  public get tagStyles(): TextStyleSet {
    return this._tagStyles;
  }
  public set tagStyles(styles: TextStyleSet) {
    // const changed = this._tagStyles !== styles;
    this._tagStyles = styles;
    // if (changed) {
    this.update();
    // }
  }

  public getStyleForTag(
    tag: string,
    attributes: AttributesList = {}
  ): TextStyleExtended {
    return getStyleForTagExt(tag, this.tagStyles, attributes);
  }

  public getStyleForTags(tags: TagWithAttributes[]): TextStyleExtended {
    const styles = tags.map(({ tagName, attributes }) =>
      this.getStyleForTag(tagName, attributes)
    );
    return combineAllStyles(styles);
  }
  public setStyleForTag(tag: string, styles: TextStyleExtended): boolean {
    // todo: check for deep equality
    // if (this.tagStyles[tag] && this.tagStyles[tag] === styles) {
    //   return false;
    // }

    this.tagStyles[tag] = styles;
    this.update();
    return true;
  }
  public removeStylesForTag(tag: string): boolean {
    if (tag in this.tagStyles) {
      delete this.tagStyles[tag];
      this.update();
      return true;
    }
    return false;
  }
  public get defaultStyle(): TextStyleExtended {
    return this.tagStyles?.default;
  }
  public set defaultStyle(defaultStyles: TextStyleExtended) {
    this.setStyleForTag("default", defaultStyles);
  }

  private _textFields: PIXI.Text[] = [];
  public get textFields(): PIXI.Text[] {
    return this._textFields;
  }

  private _textContainer: PIXI.Container;
  public get textContainer(): PIXI.Container {
    return this._textContainer;
  }
  private _debugContainer: PIXI.Container;
  public get debugContainer(): PIXI.Container {
    return this._debugContainer;
  }

  private _debugGraphics: PIXI.Graphics | null = null;

  private addChildrenToTextContainer(children: PIXI.DisplayObject[]) {
    for (const child of children) {
      this.textContainer.addChild(child);
    }
  }
  private resetTextFields() {
    this.textContainer.removeChildren();
    this._textFields = [];
  }

  private update() {
    // steps:
    // Pre-process text.
    // Parse tags in the text.
    // Measure font for each style
    // Assign styles to each segment.
    // Measure each segment
    // Create the text segments, position and add them. (draw)

    const tokens = parseTags(this.text, this.tagStyles);
    // console.log(this.untaggedText);

    const tagStyles = this.tagStyles;

    const tokensWithStyle = tokens.map((t) => {
      t.style = getStyleForToken(t, tagStyles);
      return t;
    });

    // Determine default style properties
    const wordWrapWidth = this.defaultStyle.wordWrap
      ? this.defaultStyle.wordWrapWidth
      : Number.POSITIVE_INFINITY;
    const align = this.defaultStyle.align;
    const lineSpacing = this.defaultStyle.lineSpacing;

    const measuredTokens = calculateMeasurements(
      tokensWithStyle,
      wordWrapWidth,
      align,
      lineSpacing
    );

    // Wait one frame to draw so that this doesn't happen multiple times in one frame.
    // if (this.animationRequest) {
    //   window.cancelAnimationFrame(this.animationRequest);
    // }
    // this.animationRequest = window.requestAnimationFrame(
    this.draw(measuredTokens);
    // );

    // console.log(this.untaggedText);
  }

  private draw(tokens: TaggedTextTokenComplete[][]): void {
    this.resetTextFields();
    const tokensFlat = tokens.flat();
    const textFields = this.createTextFieldsForTokens(tokensFlat);
    this.positionDisplayObjects(textFields, tokensFlat);

    this.addChildrenToTextContainer(textFields);
    this._textFields = textFields;

    if (this.options.debug) {
      this.drawDebug(tokens);
    }
  }

  private createTextFieldsForTokens(tokens: TaggedTextToken[]): PIXI.Text[] {
    return tokens
      .filter(({ text }) => text !== "") // discard blank text.
      .map((t) => this.createTextFieldForToken(t));
  }

  private createTextFieldForToken(token: TaggedTextToken): PIXI.Text {
    return new PIXI.Text(
      token.text,
      combineAllStyles([
        this.defaultStyle,
        this.getStyleForTags(token.tags),
        { wordWrap: false },
      ])
    );
  }

  private positionDisplayObjects(
    displayObjects: PIXI.DisplayObject[],
    tokens: TaggedTextTokenComplete[]
  ): void {
    for (let i = 0; i < displayObjects.length; i++) {
      const d = displayObjects[i];
      const { measurement: m } = tokens[i];
      d.x = m.x;
      d.y = m.y;
    }
  }

  // FIXME: for some reason, this doesn't work on the first time it's used in the demos.
  public drawDebug(tokens: TaggedTextTokenComplete[][]): void {
    if (this._debugGraphics === null) {
      this._debugGraphics = new PIXI.Graphics();
    }
    this.debugContainer.removeChildren();
    this.debugContainer.addChild(this._debugGraphics);

    const g = this._debugGraphics;
    g.clear();

    g.lineStyle(2, DEBUG.OUTLINE_COLOR, 1);
    g.beginFill();
    g.drawRect(1, 1, this.width, this.height);
    g.endFill();

    g.lineStyle(2, DEBUG.OUTLINE_SHADOW_COLOR, 1);
    g.beginFill();
    g.drawRect(0, 0, this.width - 1, this.height - 1);
    g.endFill();

    for (const line of tokens) {
      let lineY = Number.POSITIVE_INFINITY;
      let lineHeight = 0;
      for (const token of line) {
        const { ascent } = token.fontProperties;
        const { x, y, width, height } = token.measurement;

        lineHeight = Math.max(lineHeight, height);
        lineY = Math.min(lineY, y);

        g.lineStyle(1, DEBUG.WORD_STROKE_COLOR, 1);
        g.beginFill(DEBUG.WORD_FILL_COLOR, 0.2);
        g.drawRect(x, y, width, height);
        g.endFill();

        g.lineStyle(1, DEBUG.BASELINE_COLOR, 1);
        g.beginFill();
        g.drawRect(x, y + ascent, width, 1);
        g.endFill();

        if (token.text !== "") {
          const info = new PIXI.Text(
            token.tags.map((t) => t.tagName).join(","),
            DEBUG.TEXT_STYLE
          );
          info.x = x + 1;
          info.y = y + 1;
          this.debugContainer.addChild(info);
        }

        // const size = new PIXI.Text(
        //   `(${x},${y},${width},${height})`,
        //   DEBUG.TEXT_STYLE
        // );
        // size.x = x + 1;
        // size.y = y + 13;
        // this.debugContainer.addChild(size);
      }
      if (this.defaultStyle.wordWrap) {
        const w = this.defaultStyle.wordWrapWidth ?? this.width;
        g.lineStyle(0.5, DEBUG.LINE_COLOR, 0.2);
        g.drawRect(0, lineY, w, lineHeight);
        g.endFill();
      }
    }
  }
}
