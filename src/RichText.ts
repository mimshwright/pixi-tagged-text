import * as PIXI from "pixi.js";
import { parseTags, removeTags } from "./tags";
import {
  RichTextOptions,
  TextStyleSet,
  TextStyleExtended,
  TagWithAttributes,
  AttributesList,
  TaggedTextToken,
  ImageMap,
  IMG_SRC_PROPERTY,
  IMG_DISPLAY_PROPERTY,
} from "./types";
import { calculateMeasurements } from "./layout";
import {
  attachSpritesToToken,
  combineAllStyles,
  getStyleForTag as getStyleForTagExt,
  getStyleForToken,
} from "./style";
import { addChildrenToContainer } from "./pixiUtils";

const DEFAULT_STYLE: TextStyleExtended = {
  align: "left",
  valign: "baseline",
  [IMG_DISPLAY_PROPERTY]: "inline",
  wordWrap: true,
  wordWrapWidth: 500,
};

const DEFAULT_OPTIONS: RichTextOptions = {
  debug: false,
  splitStyle: "words",
  imgMap: {},
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
  private options: RichTextOptions;

  private _text = "";
  public get text(): string {
    return this._text;
  }
  public set text(text: string) {
    this.setText(text, false);
  }

  public setText(text: string, forceNoUpdate = false): void {
    this._text = text;

    if (forceNoUpdate !== true) {
      this.update();
    }
  }

  public get untaggedText(): string {
    return removeTags(this.text);
  }

  private _tagStyles: TextStyleSet = {};
  public get tagStyles(): TextStyleSet {
    return this._tagStyles;
  }
  public set tagStyles(styles: TextStyleSet) {
    this.setTagStyles(styles, false);
  }
  public setTagStyles(styles: TextStyleSet, forceNoUpdate = false): void {
    Object.entries(styles).forEach(([tag, style]) =>
      this.setStyleForTag(tag, style, true)
    );
    if (forceNoUpdate !== true) {
      this.update();
    }
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
  private _sprites: PIXI.Sprite[] = [];
  public get sprites(): PIXI.Sprite[] {
    return this._sprites;
  }
  private _spriteContainer: PIXI.Container;
  public get spriteContainer(): PIXI.Container {
    return this._spriteContainer;
  }
  private _debugContainer: PIXI.Container;
  public get debugContainer(): PIXI.Container {
    return this._debugContainer;
  }

  private _measuredTokens: TaggedTextToken[][] = [[]];

  private _debugGraphics: PIXI.Graphics | null = null;

  constructor(
    text = "",
    tagStyles: TextStyleSet = {},
    options: RichTextOptions = {},
    texture?: PIXI.Texture
  ) {
    super(texture);

    this._textContainer = new PIXI.Container();
    this._spriteContainer = new PIXI.Container();
    this._debugContainer = new PIXI.Container();

    this.addChild(this._textContainer);
    this.addChild(this._spriteContainer);
    this.addChild(this._debugContainer);

    this.resetChildren();

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    this.options = mergedOptions;

    tagStyles = { default: {}, ...tagStyles };
    const mergedDefaultStyles = { ...DEFAULT_STYLE, ...tagStyles.default };
    tagStyles.default = mergedDefaultStyles;
    this.tagStyles = tagStyles;

    if (this.options.imgMap) {
      this.registerImageMap(this.options.imgMap);
    }

    this.text = text;
  }

  private resetChildren() {
    this._debugContainer.removeChildren();
    this._textContainer.removeChildren();
    this._spriteContainer.removeChildren();

    this._textFields = [];
    this._sprites = [];
  }

  private registerImageMap(imgMap: ImageMap) {
    Object.entries(imgMap).forEach(([key, sprite]) => {
      // Listen for changes to sprites (e.g. when they load.)
      const texture = sprite.texture;
      if (texture !== undefined) {
        texture.baseTexture.addListener("update", () => this.update());
      }

      // create a style for each of these by default.
      const style = { [IMG_SRC_PROPERTY]: key };
      this.setStyleForTag(key, style);
    });
  }

  public getStyleForTag(
    tag: string,
    attributes: AttributesList = {}
  ): TextStyleExtended | undefined {
    return getStyleForTagExt(tag, this.tagStyles, attributes);
  }

  public getStyleForTags(tags: TagWithAttributes[]): TextStyleExtended {
    const styles = tags.map(({ tagName, attributes }) =>
      this.getStyleForTag(tagName, attributes)
    );
    return combineAllStyles(styles);
  }
  /**
   * @param tag Name of the tag to set style for
   * @param styles Style object to assign to the tag.
   * @param forceNoUpdate if True, the update() method will not be called after setting this style.
   */
  public setStyleForTag(
    tag: string,
    styles: TextStyleExtended,
    forceNoUpdate = false
  ): boolean {
    // todo: check for deep equality
    // if (this.tagStyles[tag] && this.tagStyles[tag] === styles) {
    //   return false;
    // }

    this.tagStyles[tag] = styles;

    // Override some settings on default styles.
    if (tag === "default" && this.defaultStyle[IMG_SRC_PROPERTY]) {
      // prevents accidentally setting all text to images.
      console.error(
        `Style "${IMG_SRC_PROPERTY}" can not be set on the "default" style because it will add images to EVERY tag!`
      );
      this.defaultStyle[IMG_SRC_PROPERTY] = undefined;
    }

    if (forceNoUpdate !== true) {
      this.update();
    }
    return true;
  }
  public removeStylesForTag(tag: string, forceNoUpdate = false): boolean {
    if (tag in this.tagStyles) {
      delete this.tagStyles[tag];
      if (forceNoUpdate !== true) {
        this.update();
      }
      return true;
    }
    return false;
  }

  public update(forceNoDraw = false): TaggedTextToken[][] {
    // steps:
    // Pre-process text.
    // Parse tags in the text.
    // Measure font for each style
    // Assign styles to each segment.
    // Measure each segment
    // Create the text segments, position and add them. (draw)

    const tokens = parseTags(this.text, this.tagStyles);

    const tagStyles = this.tagStyles;
    const imgMap = this.options.imgMap ?? {};

    const tokensWithStyle = tokens.map((t) => {
      t.style = getStyleForToken(t, tagStyles);
      return t;
    });

    const tokensWithSprites = tokensWithStyle.map((t) =>
      attachSpritesToToken(t, imgMap)
    );

    // Determine default style properties
    const wordWrapWidth = this.defaultStyle.wordWrap
      ? this.defaultStyle.wordWrapWidth
      : Number.POSITIVE_INFINITY;
    const align = this.defaultStyle.align;
    const lineSpacing = this.defaultStyle.lineSpacing;

    const measuredTokens = calculateMeasurements(
      tokensWithSprites,
      wordWrapWidth,
      align,
      lineSpacing
    );
    this._measuredTokens = measuredTokens;

    // Wait one frame to draw so that this doesn't happen multiple times in one frame.
    // if (this.animationRequest) {
    //   window.cancelAnimationFrame(this.animationRequest);
    // }
    // this.animationRequest = window.requestAnimationFrame(
    if (forceNoDraw !== true) {
      this.draw(measuredTokens);
    }
    // );

    if (this.options.debug) {
      console.log(this.toDebugString());
    }

    return measuredTokens;
  }

  public toDebugString(): string {
    let s = this.untaggedText + "\n  ";
    if (this._measuredTokens !== undefined) {
      s += this._measuredTokens
        .map((line, lineNumber) =>
          line
            .map((token, tokenNumber) => {
              const nl = "\n    ";
              let s = `  "${token.text}":`;
              s += `${nl}line: ${lineNumber}, word: ${tokenNumber}`;
              s += `${nl}tags: ${
                token.tags.length === 0
                  ? "<none>"
                  : token.tags.map((tag) => `<${tag.tagName}>`).join(", ")
              }`;
              s += `${nl}style: ${Object.entries(token.style)
                .map((e) => e.join(":"))
                .join("; ")}`;
              s += `${nl}size: x:${token.measurement.x} y:${token.measurement.y} width:${token.measurement.width} height:${token.measurement.height} / left:${token.measurement.left} right:${token.measurement.right} top:${token.measurement.top} bottom:${token.measurement.bottom}`;
              s += `${nl}font: fontSize:${token.fontProperties.fontSize} ascent:${token.fontProperties.ascent} descent:${token.fontProperties.descent}`;
              return s;
            })
            .join("\n")
        )
        .join("\n");
    }
    return s;
  }

  private draw(tokens: TaggedTextToken[][]): void {
    this.resetChildren();
    const tokensFlat = tokens.flat();
    const textFields = this.createTextFieldsForTokens(tokensFlat);
    const sprites = this.getSpritesFromTokens(tokensFlat);
    this.positionDisplayObjects(textFields, tokensFlat);

    addChildrenToContainer(textFields, this.textContainer);
    this._textFields = textFields;

    addChildrenToContainer(sprites, this.spriteContainer);
    this._sprites = sprites;

    if (this.options.debug) {
      this.drawDebug(tokens);
    }
  }

  private createTextFieldsForTokens(tokens: TaggedTextToken[]): PIXI.Text[] {
    return tokens
      .filter(({ text }) => text !== "") // discard blank text.
      .map((t) => this.createTextFieldForToken(t));
  }

  private getSpritesFromTokens(tokens: TaggedTextToken[]): PIXI.Sprite[] {
    const spriteTokens = tokens.filter(({ sprite }) => sprite !== undefined);
    const sprites = spriteTokens.map(({ sprite }) => sprite) as PIXI.Sprite[];
    return sprites;
  }

  private createTextFieldForToken(token: TaggedTextToken): PIXI.Text {
    return new PIXI.Text(token.text, token.style);
  }

  private positionDisplayObjects(
    textFields: PIXI.DisplayObject[],
    tokens: TaggedTextToken[]
  ): void {
    for (let i = 0; i < textFields.length; i++) {
      const d = textFields[i];
      const { measurement: m, sprite } = tokens[i];
      d.x = m.x;
      d.y = m.y;

      if (sprite !== undefined) {
        sprite.x = m.x;
        sprite.y = m.y;
      }
    }
  }

  // FIXME: for some reason, this doesn't work on the first time it's used in the demos.
  public drawDebug(tokens: TaggedTextToken[][]): void {
    this._debugGraphics = new PIXI.Graphics();
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
