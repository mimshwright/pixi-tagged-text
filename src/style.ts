import { combineRecords, isEmptyObject } from "./functionalUtils";
import {
  AttributesList,
  TaggedTextTokenPartial,
  TagWithAttributes,
  TextStyleExtended,
  TextStyleSet,
  IMG_SRC_PROPERTY,
  ImageMap,
} from "./types";
import { cloneSprite } from "./pixiUtils";

/**
 * Combine 2 styles into one.
 */
export const combineStyles = (
  a: TextStyleExtended,
  b: TextStyleExtended
): TextStyleExtended => combineRecords(a, b);

/**
 * Combines multiple styles into one.
 * @param styles List of styles to combine.
 */
export const combineAllStyles = (
  styles: (TextStyleExtended | undefined)[]
): TextStyleExtended =>
  (styles.filter((s) => s !== undefined) as TextStyleExtended[]).reduce(
    combineStyles,
    {}
  );

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
  return combineRecords(style, attributes);
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

/**
 * Gets style associated with the stacked tags for the token.
 */
export const getStyleForToken = (
  token: TaggedTextTokenPartial,
  tagStyles: TextStyleSet
): TextStyleExtended =>
  combineStyles(tagStyles.default, getStyleForTags(token.tags, tagStyles));

/**
 * Returns true if the tag has an imgSrc property in one of its styles.
 */
export const isTokenImage = (token: TaggedTextTokenPartial): boolean =>
  token.style?.[IMG_SRC_PROPERTY] !== undefined ||
  token.tags.filter(
    ({ attributes }) => attributes[IMG_SRC_PROPERTY] !== undefined
  ).length > 0;

export const attachSpritesToToken = (
  token: TaggedTextTokenPartial,
  imgMap: ImageMap
): TaggedTextTokenPartial => {
  if (isTokenImage(token) === false) return token;

  const imgSrc = token.style?.[IMG_SRC_PROPERTY] as string;
  const sprite = cloneSprite(imgMap[imgSrc]);

  if (sprite === undefined) {
    throw new Error(
      `An image tag with ${IMG_SRC_PROPERTY}="${imgSrc}" was encountered, but there was no matching sprite in the sprite map. Please include a valid Sprite in the imgMap property in the options in your RichText constructor.`
    );
  }

  if (token.text !== "" && token.text !== " ") {
    console.error(
      `Encountered an image tag with ${IMG_SRC_PROPERTY}="${imgSrc}" but also contains the text "${token.text}". Text inside of image tags is not currently supported and has been removed.`
    );
  }
  token.text = " ";
  token.sprite = sprite;

  return token;
};
