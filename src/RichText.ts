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
  skipUpdates: false,
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
  /** Settings for the RichText component. */
  private options: RichTextOptions;

  /**
   * Determines whether a function should call update().
   * @param forcedSkipUpdate This is the parameter provided to some functions that allow you to skip the update.
   * It's factored in along with the defaults to figure out what to do.
   */
  private shouldUpdate(forcedSkipUpdate?: boolean): boolean {
    if (forcedSkipUpdate !== undefined) {
      return !forcedSkipUpdate;
    }
    return !this.options.skipUpdates;
  }

  private _text = "";
  public get text(): string {
    return this._text;
  }

  /**
   * Alternative implicit setter for text. Always uses default for skipUpdate.
   */
  public set text(text: string) {
    this.setText(text);
  }

  /**
   * Setter for text that allows you to override the default for skipping the update.
   * @param text Text to add to component with (optional) tags.
   * @param skipUpdate *For advanced users* overrides default for upating / redrawing after changing the text.
   * When true, setText() never updates even if default is false, and vice versa.
   * Options are true, false, or undefined. Undefined is the default and means it uses whatever setting
   * is provided in this.options.
   */
  public setText(text: string, skipUpdate?: boolean): void {
    this._text = text;

    if (this.shouldUpdate(skipUpdate)) {
      this.update();
    }
  }

  /**
   * Returns the text content with all tags stripped out.
   */
  public get untaggedText(): string {
    return removeTags(this.text);
  }

  private _tagStyles: TextStyleSet = {};
  public get tagStyles(): TextStyleSet {
    return this._tagStyles;
  }

  /**
   * Alternative implicit setter for tagStyles. Always uses default for skipUpdate.
   */
  public set tagStyles(styles: TextStyleSet) {
    this.setTagStyles(styles);
  }

  /**
   * Setter for tagStyles.
   * @param styles Object with strings for keys representing tag names, mapped to style objects.
   * @param skipUpdate *For advanced users* overrides default for upating / redrawing after changing the styles.
   * When true, setTagStyles() never updates even if default is false, and vice versa.
   * Options are true, false, or undefined. Undefined is the default and means it uses whatever setting
   * is provided in this.options.
   */
  public setTagStyles(styles: TextStyleSet, skipUpdate?: boolean): void {
    Object.entries(styles).forEach(([tag, style]) =>
      this.setStyleForTag(tag, style, true)
    );
    if (this.shouldUpdate(skipUpdate)) {
      this.update();
    }
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
   * Set a style to be used by a single tag.
   * @param tag Name of the tag to set style for
   * @param styles Style object to assign to the tag.
   * @param skipUpdate *For advanced users* overrides default for upating / redrawing after changing the styles.
   * When true, setStyleForTag() never updates even if default is false, and vice versa.
   * Options are true, false, or undefined. Undefined is the default and means it uses whatever setting
   * is provided in this.options.
   */
  public setStyleForTag(
    tag: string,
    styles: TextStyleExtended,
    skipUpdate?: boolean
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

    if (this.shouldUpdate(skipUpdate)) {
      this.update();
    }
    return true;
  }
  /**
   * Removes a style associated with a tag. Note, inline attributes are not affected.
   * @param tag Name of the tag to delete the style of.
   * @param skipUpdate *For advanced users* overrides default for upating / redrawing after changing the styles.
   * When true, removeStylesForTag() never updates even if default is false, and vice versa.
   * Options are true, false, or undefined. Undefined is the default and means it uses whatever setting
   * is provided in this.options.
   */
  public removeStylesForTag(tag: string, skipUpdate?: boolean): boolean {
    if (tag in this.tagStyles) {
      delete this.tagStyles[tag];
      if (this.shouldUpdate(skipUpdate)) {
        this.update();
      }
      return true;
    }
    return false;
  }

  public get defaultStyle(): TextStyleExtended {
    return this.tagStyles?.default;
  }
  /**
   * Alternative implicit setter for defaultStyle. Always uses default for skipUpdate.
   */
  public set defaultStyle(defaultStyles: TextStyleExtended) {
    this.setDefaultStyle(defaultStyles);
  }
  /**
   * Setter for default styles. A shortcut to this.setStyleForTag("default",...)
   * @param styles A style object to use as the default styles for all text in the component.
   * @param skipUpdate *For advanced users* overrides default for upating / redrawing after changing the styles.
   * When true, setDefaultStyle() never updates even if default is false, and vice versa.
   * Options are true, false, or undefined. Undefined is the default and means it uses whatever setting
   * is provided in this.options.
   */
  public setDefaultStyle(
    defaultStyles: TextStyleExtended,
    skipUpdate?: boolean
  ): void {
    this.setStyleForTag("default", defaultStyles, skipUpdate);
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

  private _tokens: TaggedTextToken[][] = [[]];
  public get tokens(): TaggedTextToken[][] {
    return this._tokens;
  }

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

  /**
   * Removes all PIXI children from this component's containers.
   * Deletes references to sprites and text fields.
   */
  private resetChildren() {
    this._debugContainer.removeChildren();
    this._textContainer.removeChildren();
    this._spriteContainer.removeChildren();

    this._textFields = [];
    this._sprites = [];
  }

  /**
   * Creates associations between string-based keys like "img" and
   * image Sprite objects which are included in the text.
   * @param imgMap
   */
  private registerImageMap(imgMap: ImageMap) {
    Object.entries(imgMap).forEach(([key, sprite]) => {
      // Listen for changes to sprites (e.g. when they load.)
      const texture = sprite.texture;
      if (this.shouldUpdate() && texture !== undefined) {
        texture.baseTexture.addListener("update", () => this.update());
      }

      // create a style for each of these by default.
      const style = { [IMG_SRC_PROPERTY]: key };
      this.setStyleForTag(key, style);
    });
  }

  /**
   * Calculates styles, positioning, etc. of the text and styles and creates a
   * set of objects that represent where each portion of text and image should
   * be drawn.
   * @param skipDraw *For advanced users* overrides default for redrawing the styles.
   * When true, update() will skip the call to draw() (even if the default is false).
   * Options are true, false, or undefined. Undefined is the default and means it uses whatever setting
   * is provided in this.options.
   */
  public update(skipDraw?: boolean): TaggedTextToken[][] {
    // steps:
    // Pre-process text.
    // Parse tags in the text.
    // Measure font for each style
    // Assign styles to each segment.
    // Measure each segment
    // Create the text segments, position and add them. (draw)

    const parsedTags = parseTags(this.text, this.tagStyles);

    const tagStyles = this.tagStyles;
    const imgMap = this.options.imgMap ?? {};

    const tokensWithStyle = parsedTags.map((t) => {
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

    const finalTokens = calculateMeasurements(
      tokensWithSprites,
      wordWrapWidth,
      align,
      lineSpacing
    );
    this._tokens = finalTokens;

    // Wait one frame to draw so that this doesn't happen multiple times in one frame.
    // if (this.animationRequest) {
    //   window.cancelAnimationFrame(this.animationRequest);
    // }
    // this.animationRequest = window.requestAnimationFrame(
    if (this.shouldUpdate(skipDraw)) {
      this.draw();
    }
    // );

    if (this.options.debug) {
      console.log(this.toDebugString());
    }

    return finalTokens;
  }

  public draw(): void {
    this.resetChildren();
    const tokens = this._tokens;
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

  /**
   * Converts the text properties from this.tokens into a human readable string.
   * This is automatically logged to the console on update when debug option is set to true.
   */
  public toDebugString(): string {
    let s = this.untaggedText + "\n  ";
    if (this._tokens !== undefined) {
      s += this._tokens
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
