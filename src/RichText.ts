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
} from "./types";

export default class RichText extends PIXI.Sprite {
  private _text = "";
  public get text(): string {
    return this._text;
  }
  public set text(text: string) {
    const changed = this._text !== text;
    this._text = text;

    if (changed) {
      this.update();
    }
  }
  public get untaggedText(): string {
    return this.parseTags().reduce((acc, { text }) => acc + text, "");
  }

  private _tagStyles: TextStyleSet = {};
  public get tagStyles(): TextStyleSet {
    return this._tagStyles;
  }
  public set tagStyles(styles: TextStyleSet) {
    const changed = this._tagStyles !== styles;
    this._tagStyles = styles;
    if (changed) {
      this.update();
    }
  }
  public combineStyles(styles: TextStyleExtended[]): TextStyleExtended {
    return styles.reduce(
      (comboStyle, style) => (comboStyle = { ...comboStyle, ...style }),
      {}
    );
  }
  public getStyleForTag(tag: string): TextStyleExtended {
    return this.tagStyles[tag];
  }
  public getStyleForTags(tags: TagWithAttributes[]): TextStyleExtended {
    const styles = tags.map(({ tagName }) => this.getStyleForTag(tagName));
    return this.combineStyles(styles);
  }
  public setStyleForTag(tag: string, styles: TextStyleExtended): boolean {
    if (this.tagStyles[tag] && this.tagStyles[tag] === styles) {
      return false;
    }

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

  constructor(text = "", tagStyles: TextStyleSet = {}, texture?: PIXI.Texture) {
    super(texture);

    this._textContainer = new PIXI.Container();
    this.addChild(this.textContainer);

    this.tagStyles = tagStyles;

    this.text = text;

    this.initEvents();
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
    console.log(tokensToString(tokens));

    this.resetTextFields();
    const textFields = this.createTextFieldsForTokens(tokens);
    this.addChildrenToTextContainer(textFields);
    this._textFields = textFields;

    // console.log(this.untaggedText);
  }
  private parseTags() {
    return parseTagsExt(this.text, this.tagStyles);
  }

  private createTextFieldsForTokens(tokens: TaggedTextToken[]) {
    return tokens
      .filter(({ text }) => text !== "") // discard blank text.
      .map(
        (token) => new PIXI.Text(token.text, this.getStyleForTags(token.tags))
      );
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
}
