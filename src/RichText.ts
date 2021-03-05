import * as PIXI from "pixi.js";
import interactionEvents from "./interactionEvents";
import { MstInteractionEvent, TextStyleSet, HitboxData } from "./types";

export default class RichText extends PIXI.Sprite {
  private _text = "";
  public get text(): string {
    return this._text;
  }
  public set text(text: string) {
    this._text = text;
  }

  public setStyles(styles: TextStyleSet): void {
    //noop
    styles;
  }

  private hitboxes: HitboxData[] = [];

  constructor(text = "", styles: TextStyleSet = {}, texture?: PIXI.Texture) {
    super(texture);

    this.text = text;

    this.setStyles(styles);

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
}
