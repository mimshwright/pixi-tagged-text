import { getTagRegex, matchToMeta } from "./Tags";
import * as PIXI from "pixi.js";
import interactionEvents from "./interactionEvents";
import {
  MstInteractionEvent,
  TextStyleSet,
  HitboxData,
  TextStyleExtended,
  TagMatchData,
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

  private _tagStyles: TextStyleSet = {};
  public get tagStyles(): TextStyleSet {
    return this._tagStyles;
  }
  public set tagStyles(styles: TextStyleSet) {
    this._tagStyles = styles;
  }
  public getStyleForTag(tag: string): TextStyleExtended {
    return this.tagStyles[tag];
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

  public textFields: PIXI.Text[] = [];

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

    this.tagStyles = tagStyles;

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
    this.removeTextFieldsFromTextContainer();

    // TODO:
    // Parse tags and tokenize text.
    // create a textfield for each token.
    // position each text field correctly.
    // draw?

    const firstText = new PIXI.Text(rawText, this.defaultStyle);
    this.textFields[0] = firstText;

    const tags = this.parseTags(rawText);

    this.addTextFieldsToTextContainer();
  }

  private addTextFieldsToTextContainer() {
    for (const child of this.textFields) {
      this.textContainer.addChild(child);
    }
  }
  private removeTextFieldsFromTextContainer() {
    this.textContainer.removeChildren();
  }

  private parseTags(str: string) {
    const re = getTagRegex(this.tagStyles, true, false);

    const matches: TagMatchData[] = [];
    const matchesRaw = [];
    let match;
    while ((match = re.exec(str))) {
      const meta = matchToMeta(match);
      matchesRaw.push(match);
      matches.push(meta);
    }

    match = null;
    const segments: string[] = [];
    let remaining = str;
    for (match of matches) {
      const { tag } = match;
      const [segment, newRemaining] = remaining.split(tag);
      segments.push(segment);
      remaining = newRemaining;
    }

    const openingTags = matches.filter(({ isOpening }) => isOpening);

    console.log({ matchesRaw });
    console.log({ matches });
    console.log({ openingTags });
    console.log({ segments });

    return matches;

    /*
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
    */
  }
}
