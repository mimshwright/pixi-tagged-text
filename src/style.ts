import {
  AttributesList,
  TagWithAttributes,
  TextStyleExtended,
  TextStyleSet,
} from "./types";

export const combineRecords = <
  A extends Record<string, unknown>,
  B extends Record<string, unknown> = A
>(
  a: A,
  b: B
): A & B => ({
  ...a,
  ...b,
});

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
  styles: TextStyleExtended[]
): TextStyleExtended => styles.reduce(combineStyles, {});

/**
 * Replaces properties of a TextStyle object with new values.
 * (Since AttributeLists are basically partially defined styles, this is the same as combineStyles)
 * @param attributes List of attributes to overwrite in the target style.
 * @param style The style to modify.
 */
export const injectAttributes = (
  attributes: AttributesList,
  style: TextStyleExtended
): TextStyleExtended => combineRecords(style, attributes);

/**
 * Converts TagWithAttributes into a style object.
 * @param param0 A TagWithAttributes object that has a tag name matched with any optional attributes.
 * @param tagStyles Set of tag styles to search.
 */
const tagWithAttributesToStyle = (
  { tagName, attributes }: TagWithAttributes,
  tagStyles: TextStyleSet
): TextStyleExtended => getStyleForTag(tagName, tagStyles, attributes);

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
): TextStyleExtended => injectAttributes(attributes, tagStyles[tagName]);

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
  combineAllStyles(tags.map((tag) => tagWithAttributesToStyle(tag, tagStyles)));
