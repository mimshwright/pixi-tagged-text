import {
  tokensToString,
  parseTags as parseTagsExt,
  removeTags,
  LINE_BREAK_TAG_NAME,
} from "./Tags";
import * as PIXI from "pixi.js";
import interactionEvents from "./interactionEvents";
import {
  MstInteractionEvent,
  TextStyleSet,
  HitboxData,
  TextStyleExtended,
  TaggedTextToken,
  TagWithAttributes,
  AttributesList,
} from "./types";

export default class RichText extends PIXI.Sprite {
  constructor(text = "", tagStyles: TextStyleSet = {}, texture?: PIXI.Texture) {
    super(texture);

    this._textContainer = new PIXI.Container();
    this.addChild(this.textContainer);

    this.tagStyles = tagStyles;

    this.text = text;

    this.initEvents();
  }

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

  public combineStyles(styles: TextStyleExtended[]): TextStyleExtended {
    return styles.reduce(
      (comboStyle, style) => (comboStyle = { ...comboStyle, ...style }),
      {}
    );
  }

  private injectAttributes(
    style: TextStyleExtended,
    attributes: AttributesList
  ): TextStyleExtended {
    return { ...style, ...attributes };
  }

  public getStyleForTag(
    tag: string,
    attributes: AttributesList
  ): TextStyleExtended {
    const style = this.tagStyles[tag];
    const styleWithAttributes = this.injectAttributes(style, attributes);
    return styleWithAttributes;
  }
  public getStyleForTags(tags: TagWithAttributes[]): TextStyleExtended {
    const styles = tags.map(({ tagName, attributes }) =>
      this.getStyleForTag(tagName, attributes)
    );
    return this.combineStyles(styles);
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

  private hitboxes: HitboxData[] = [];

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

  private initEvents() {
    const migrateEvent = (e: PIXI.InteractionEvent) =>
      this.handleInteraction(e);

    for (const event in interactionEvents) {
      this.on(event, migrateEvent);
    }
  }

  private handleInteraction(e: PIXI.InteractionEvent) {
    const ev = e as MstInteractionEvent;
    const localPoint = e.data.getLocalPosition(this);
    let targetHitbox: HitboxData | null = null;

    for (const hitbox of this.hitboxes) {
      if (contains(hitbox, localPoint)) {
        targetHitbox = hitbox;
        break;
      }
    }
    ev.targetTag = targetHitbox?.tag;

    function contains(hitbox: HitboxData, point: PIXI.Point): boolean {
      return hitbox.hitbox.contains(point.x, point.y);
    }
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

    const measurements = this.calculateMeasurements(tokens, 600);
    console.log(measurements);

    this.resetTextFields();
    const textFields = this.createTextFieldsForTokens(tokens);
    this.positionDisplayObjects(textFields, measurements);
    this.addChildrenToTextContainer(textFields);
    this._textFields = textFields;

    this.drawDebug();

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
      this.combineStyles([this.defaultStyle, this.getStyleForTags(token.tags)])
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

  private calculateMeasurements(
    tokens: TaggedTextToken[],
    maxLineWidth: number
  ): PIXI.Rectangle[] {
    const sizer = new PIXI.Text("");
    const measurements = [];
    let lastMeasurement = new PIXI.Rectangle(0, 0, 0, 0);
    let largestLineHeight = 0;
    const offset = new PIXI.Point(0, 0);

    for (const token of tokens) {
      for (const tag of token.tags) {
        if (tag.tagName === LINE_BREAK_TAG_NAME) {
          // handle new line.
          offset.x = 0;
          offset.y += largestLineHeight;
          break;
        }
      }
      if (token.text !== "") {
        sizer.text = token.text;
        sizer.style = this.combineStyles([
          this.defaultStyle,
          this.getStyleForTags(token.tags),
        ]);

        largestLineHeight = Math.max(lastMeasurement.height, largestLineHeight);

        const x = offset.x + sizer.x;
        const y = offset.y + sizer.y;
        const w = sizer.width;
        const h = sizer.height;

        const size = new PIXI.Rectangle(x, y, w, h);

        offset.x = size.right;

        measurements.push(size);
        lastMeasurement = size;
      }
    }
    return measurements;
  }

  // FIXME: for some reason, this doesn't work on the first time it's used in the demos.
  public drawDebug(): void {
    for (const text of this.textFields) {
      const c = text.context;
      c.strokeStyle = "red";
      c.lineWidth = 2;
      c.strokeRect(0, 0, text.width, text.height);
    }
  }
}
