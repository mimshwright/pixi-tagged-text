import { combineRecords, isDefined, pluck } from "./functionalUtils";
import {
  AttributesList,
  TagWithAttributes,
  TextStyleExtended,
  TextStyleSet,
  IMG_SRC_PROPERTY,
  ImageMap,
  TextToken,
  TagToken,
  TagTokens,
  StyledTokens,
  StyledToken,
  SpriteToken,
  isEmptyObject,
} from "./types";
import { cloneSprite } from "./pixiUtils";
import * as PIXI from "pixi.js";

/**
 * Combine 2 styles into one.
 */
export const combineStyles: (
  a: TextStyleExtended,
  b: TextStyleExtended
) => TextStyleExtended = combineRecords;

/**
 * Combines multiple styles into one.
 * @param styles List of styles to combine.
 */
export const combineAllStyles = (
  styles: (TextStyleExtended | undefined)[]
): TextStyleExtended =>
  (styles.filter(isDefined) as TextStyleExtended[]).reduce(combineStyles, {});

export const convertAttributeValues = (
  attributes: AttributesList
): AttributesList => {
  const convertedAttributes: AttributesList = {};
  for (const key in attributes) {
    const value = attributes[key] as string;
    if (isNaN(parseFloat(value)) === false) {
      convertedAttributes[key] = parseFloat(value);
    } else {
      convertedAttributes[key] = value;
    }
  }
  return convertedAttributes;
};

/**
 * Replaces properties of a TextStyle object with new values.
 * (Since AttributeLists are basically partially defined styles, this is the same as combineStyles)
 * @param attributes List of attributes to overwrite in the target style.
 * @param style The style to modify.
 */
export const injectAttributes = (
  attributes: AttributesList = {},
  style: TextStyleExtended = {}
): TextStyleExtended | undefined => {
  if (isEmptyObject(style) && isEmptyObject(attributes)) return undefined;
  return combineRecords(style, convertAttributeValues(attributes));
};

/**
 * Looks up a tag in a list of tag styles (with optional attributes) and returns it.
 * @param tagName Tag name to check.
 * @param tagStyles Set of tag styles to search.
 * @param attributes Attributes to inject into the style (optional).
 */
export const getStyleForTag = (
  tagName: string,
  tagStyles: TextStyleSet,
  attributes: AttributesList = {}
): TextStyleExtended | undefined => {
  const style = injectAttributes(attributes, tagStyles[tagName]);
  if (style == {}) return undefined;
  return style;
};

/**
 * Converts TagWithAttributes into a style object.
 * @param param0 A TagWithAttributes object that has a tag name matched with any optional attributes.
 * @param tagStyles Set of tag styles to search.
 */
export const tagWithAttributesToStyle = (
  { tagName, attributes }: TagWithAttributes,
  tagStyles: TextStyleSet
): TextStyleExtended =>
  getStyleForTag(tagName, tagStyles, attributes) as TextStyleExtended;

/**
 * Gets styles for several tags and returns a single combined style object.
 * @param tags Tags (with attribues) to look up.
 * @param tagStyles Set of tag styles to search.
 * @returns
 */
export const getStyleForTags = (
  tags: TagWithAttributes[],
  tagStyles: TextStyleSet
): TextStyleExtended =>
  // TODO: Memoize
  combineAllStyles(tags.map((tag) => tagWithAttributesToStyle(tag, tagStyles)));

export const mapTagsToStyles = (
  tokens: TagTokens,
  styles: TextStyleSet,
  imgMap?: ImageMap
): StyledTokens => {
  const tagStack: TagWithAttributes[] = [];
  const styleMap: Record<string, TextStyleExtended> = {};

  const convertTagTokenToStyledToken = (
    token: TagToken | TextToken
  ): StyledToken | TextToken => {
    if (typeof token === "string") {
      return token as TextToken;
    }

    let style: TextStyleExtended = {};
    let tags = "";
    if (token.tag) {
      const { tag, attributes = {} } = token;
      tagStack.push({ tagName: tag, attributes });
      tags = pluck("tagName")(tagStack).join(",");

      const tagHash = JSON.stringify(tagStack);
      if (styleMap[tagHash] === undefined) {
        styleMap[tagHash] = getStyleForTags(tagStack, styles);
      }

      style = styleMap[tagHash];
    }

    const styledToken: StyledToken = {
      style,
      tags: tags,
      children: token.children.map(convertTagTokenToStyledToken),
    };

    // If a matching sprite exits in the imgMap...
    const imgKey = style[IMG_SRC_PROPERTY] ?? "";
    if (imgKey) {
      if (imgMap === undefined) {
        throw new Error(
          `An image tag with ${IMG_SRC_PROPERTY}="${imgKey}" was encountered, but no imgMap was provided. Please include a valid Sprite in the imgMap property in the options in your RichText constructor.`
        );
      }
      const sprite: SpriteToken | undefined = imgMap[imgKey];
      if (sprite === undefined) {
        throw new Error(
          `An image tag with ${IMG_SRC_PROPERTY}="${imgKey}" was encountered, but there was no matching sprite in the sprite map. Please include a valid Sprite in the imgMap property in the options in your RichText constructor.`
        );
      }
      if (sprite instanceof PIXI.Sprite === false) {
        throw new Error(
          `The image reference you provided for "${imgKey}" is not a Sprite. The imgMap can only accept PIXI.Sprite instances.`
        );
      }

      // insert sprite as first token.
      const cloneOfSprite = cloneSprite(sprite);
      styledToken.children = [cloneOfSprite, ...styledToken.children];
    }

    tagStack.pop();

    return styledToken;
  };

  return convertTagTokenToStyledToken(tokens) as StyledTokens;
};
