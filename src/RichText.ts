import * as PIXI from "pixi.js";
import { parseTags as parseTagsExt, removeTags } from "./tags";
import {
  RichTextOptions,
  TextStyleSet,
  TextStyleExtended,
  TaggedTextToken,
  TagWithAttributes,
  AttributesList,
} from "./types";
import { calculateMeasurements } from "./layout";
import { combineAllStyles, getStyleForTag as getStyleForTagExt } from "./style";

const DEFAULT_STYLE: TextStyleExtended = {
  align: "left",
  wordWrap: true,
  wordWrapWidth: 500,
};

const DEFAULT_OPTIONS: RichTextOptions = {
  debug: false,
  splitStyle: "words",
};
export default class RichText extends PIXI.Sprite {
  constructor(
    text = "",
    tagStyles: TextStyleSet = {},
    options: RichTextOptions = {},
    texture?: PIXI.Texture
  ) {
    super(texture);

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
    // TODO:
    // position each text field correctly.
    // draw?

    // const rawText = this.text;
    this.resetTextFields();

    const tokens = this.parseTags();
    // console.log(this.untaggedText);
    // console.log(tokensToString(tokens));

    const wordWrapWidth = this.defaultStyle.wordWrap
      ? this.defaultStyle.wordWrapWidth
      : Number.POSITIVE_INFINITY;
    const align = this.defaultStyle.align;
    const lineSpacing = this.defaultStyle.lineSpacing;
    const measurements = calculateMeasurements(
      tokens,
      wordWrapWidth,
      this.tagStyles,
      align,
      lineSpacing
    );
    console.log(measurements);

    // console.log({
    //   wordWrap: this.defaultStyle.wordWrap,
    //   width: this.width,
    //   localBounds: this.getLocalBounds(),
    //   wordWrapWidth: this.defaultStyle.wordWrapWidth,
    // });

    this.resetTextFields();
    const textFields = this.createTextFieldsForTokens(tokens);
    this.positionDisplayObjects(textFields, measurements);
    this.addChildrenToTextContainer(textFields);
    this._textFields = textFields;

    if (this.options.debug) {
      this.drawDebug();
    }

    // console.log(this.untaggedText);
  }

  private parseTags() {
    return parseTagsExt(this.text, this.tagStyles);
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
    measurements: PIXI.Rectangle[]
  ): void {
    for (let i = 0; i < displayObjects.length; i++) {
      const d = displayObjects[i];
      const m = measurements[i];
      d.x = m.x;
      d.y = m.y;
    }
  }

  // FIXME: for some reason, this doesn't work on the first time it's used in the demos.
  public drawDebug(): void {
    for (const text of this.textFields) {
      const c = text.context;
      c.save();
      c.strokeStyle = "red";
      c.lineWidth = 2;
      c.rect(0, 0, text.width, text.height);
      c.stroke();
      c.restore();
    }
  }
}
