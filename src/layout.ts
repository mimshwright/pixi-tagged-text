import { combineAllStyles, getStyleForTags } from "./style";
import { LINE_BREAK_TAG_NAME } from "./tags";
import { Align, TaggedTextToken, TextStyleSet } from "./types";

const updateOffsetForNewLine = (
  offset: PIXI.Point,
  largestLineHeight: number,
  lineSpacing: number
): PIXI.Point => new PIXI.Point(0, offset.y + largestLineHeight + lineSpacing);

const rectFromContainer = (
  container: PIXI.Container,
  offset: PIXI.Point
): PIXI.Rectangle => {
  const w = container.width;
  const h = container.height;
  const x = offset.x + container.x;
  const y = offset.y + container.y;

  return new PIXI.Rectangle(x, y, w, h);
};

/**
 *
 * @param tokens List of TaggedTextTokens to use for separating text based on tags
 * @param maxLineWidth The maximum width of one line of text.
 * @param tagStyles List of tagStyles to use for calculating text size.
 * @param align Alignment of text.
 * @param lineSpacing Number of pixels between each line of text.
 * @returns Array of Rectangle objects pertaining to each piece of text.
 */
export const calculateMeasurements = (
  tokens: TaggedTextToken[],
  maxLineWidth: number = Number.POSITIVE_INFINITY,
  tagStyles: TextStyleSet,
  align: Align = "left",
  lineSpacing = 0
): PIXI.Rectangle[] => {
  // Create a text field to use for measurements.
  const sizer = new PIXI.Text("");

  const measurements: PIXI.Rectangle[] = [];
  let previousMeasurement = new PIXI.Rectangle(0, 0, 0, 0);
  let largestLineHeight = 0;
  let offset = new PIXI.Point(0, 0);
  const { default: defaultStyle } = tagStyles;

  // Todo: use Align parameter.
  align;

  // TODO: group measurements by line
  for (const token of tokens) {
    for (const tag of token.tags) {
      if (tag.tagName === LINE_BREAK_TAG_NAME) {
        offset = updateOffsetForNewLine(offset, largestLineHeight, lineSpacing);
        break;
      }
    }
    if (token.text !== "") {
      sizer.text = token.text;
      sizer.style = combineAllStyles([
        defaultStyle,
        getStyleForTags(token.tags, tagStyles),
        { wordWrap: false },
      ]);

      largestLineHeight = Math.max(
        previousMeasurement.height,
        largestLineHeight
      );

      let size = rectFromContainer(sizer, offset);

      // if new size would exceed the max line width...
      if (size.right > maxLineWidth) {
        offset = updateOffsetForNewLine(offset, largestLineHeight, lineSpacing);
        size = rectFromContainer(sizer, offset);
      }

      offset.x = size.right;

      measurements.push(size);
      previousMeasurement = size;
    }
  }
  return measurements;
};
