import { tokensToString, parseTags as parseTagsExt } from "./Tags";
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
    return this.parseTags().reduce((acc, { text }) => acc + text, "");
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
    const rawText = this.text;
    this.resetTextFields();

    // TODO:
    // Parse tags and tokenize text.
    // create a textfield for each token.
    // position each text field correctly.
    // draw?

    const firstText = new PIXI.Text(rawText, this.defaultStyle);
    this.textFields[0] = firstText;

    const tokens = this.parseTags();
    // console.log(tokensToString(tokens));

    this.resetTextFields();
    const textFields = this.createTextFieldsForTokens(tokens);
    this.addChildrenToTextContainer(textFields);
    this._textFields = textFields;

    this.layout();

    this.drawDebug();

    // console.log(this.untaggedText);
  }

  private parseTags() {
    return parseTagsExt(this.text, this.tagStyles);
  }

  private createTextFieldsForTokens(tokens: TaggedTextToken[]) {
    return tokens
      .filter(({ text }) => text !== "") // discard blank text.
      .map(
        (token) =>
          new PIXI.Text(
            token.text,
            this.combineStyles([
              this.defaultStyle,
              this.getStyleForTags(token.tags),
            ])
          )
      );
  }

  private layout() {
    if (this.textFields.length === 0) {
      return;
    }

    // calculate positions.

    const dimensions = this.textFields.map(
      (text) => new PIXI.Point(text.width, text.height)
    );

    const startPoint = new PIXI.Point(0, 0);

    const positions: PIXI.Point[] = [];
    for (let i = 0; i < this.textFields.length; i++) {
      if (i === 0) {
        positions[i] = startPoint;
        continue;
      }
      // For now, only use X
      const previousFieldSize = dimensions[i - 1];
      const previousPosition = positions[i - 1];
      positions[i] = new PIXI.Point(
        previousPosition.x + previousFieldSize.x,
        startPoint.y
      );
    }

    // console.log(this.textFields);
    // console.log(dimensions.map((d) => `[${d.x}, ${d.y}] `));
    // console.log(positions.map((p) => `[${p.x},${p.y}]`).join(", "));

    this.textFields.forEach((text, i) => {
      const { x, y } = positions[i];
      text.x = x;
      text.y = y;
      // TEMP: remove line breaks from text.
      text.text = text.text.replace(/\n/g, "");
    });
  }

  public drawDebug(): void {
    for (const text of this.textFields) {
      const c = text.context;
      c.strokeStyle = "red";
      c.lineWidth = 2;
      c.strokeRect(0, 0, text.width, text.height);
    }
  }
}
