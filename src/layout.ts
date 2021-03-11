import * as PIXI from "pixi.js";
import { combineAllStyles, getStyleForTags } from "./style";
import { LINE_BREAK_TAG_NAME } from "./tags";
import {
  Align,
  Measurement,
  MeasurementLine,
  MeasurementLines,
  Point,
  TaggedTextToken,
  TextStyleSet,
} from "./types";

const updateOffsetForNewLine = (
  offset: Point,
  largestLineHeight: number,
  lineSpacing: number
): Point => new PIXI.Point(0, offset.y + largestLineHeight + lineSpacing);

const rectFromContainer = (
  container: PIXI.Container,
  offset: Point
): PIXI.Rectangle => {
  const w = container.width;
  const h = container.height;
  const x = offset.x + container.x;
  const y = offset.y + container.y;

  return new PIXI.Rectangle(x, y, w, h);
};

/**
 * Move a point by an offset.
 * Point p => p -> p-> -> p
 * @param offset Amount to translate the target.
 * @param point Target to translate.
 */
export const translatePoint = (offset: Point) => (point: Point): Point => ({
  ...point,
  x: point.x + offset.x,
  y: point.y + offset.y,
});

/**
 * Same as translatePoint but for all the points in an array.
 */
export const translateLine = (offset: Point) => (
  line: MeasurementLine
): MeasurementLine => line.map(translatePoint(offset)) as MeasurementLine;

export const lineWidth = (line: MeasurementLine): number => {
  const firstWord = line[0];
  const lastWord = line[line.length - 1];

  if (firstWord === undefined) {
    return 0;
  }
  if (lastWord === firstWord) {
    return firstWord.width;
  }
  return lastWord.right - firstWord.left;
};

export const center = (x: number, context: number): number => (context - x) / 2;

export const justifyLine = (maxLineWidth: number) => (
  line: MeasurementLine
): MeasurementLine => {
  const w = lineWidth(line);
  const totalSpace = maxLineWidth - w;
  const space = totalSpace / (line.length - 1);

  if (line.length === 0) {
    return [];
  }
  if (line.length < 2) {
    line[0].x = center(line[0].x, maxLineWidth);
  } else {
    let previuosWord;
    for (let i = 0; i < line.length; i++) {
      const word = line[i];
      const newWord = word.clone();
      let x = 0;
      if (previuosWord === undefined) {
        x = 0;
      } else {
        x = previuosWord.right + space;
      }
      newWord.x = x;
      previuosWord = newWord;
      line[i] = newWord;
    }
  }
  return line;
};

/**
 * Adjusts the values in the lines to match the current layout.
 */
export const alignTextInLines = (
  align: Align,
  maxLineWidth: number,
  lines: MeasurementLines
): MeasurementLines =>
  align === "left"
    ? lines
    : align === "right"
    ? lines.map((line) =>
        translateLine({
          x: maxLineWidth - lineWidth(line),
          y: 0,
        })(line)
      )
    : align === "center"
    ? lines.map((line) =>
        translateLine({ x: center(lineWidth(line), maxLineWidth), y: 0 })(line)
      )
    : align === "justify"
    ? lines.map(justifyLine(maxLineWidth))
    : lines;

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
): Measurement[] => {
  // Create a text field to use for measurements.
  const sizer = new PIXI.Text("");

  const measurements: Measurement[] = [];
  let previousMeasurement = new PIXI.Rectangle(0, 0, 0, 0);
  let largestLineHeight = 0;
  let offset = { x: 0, y: 0 };
  const { default: defaultStyle } = tagStyles;
  let currentLine = 0;
  const lines: MeasurementLines = [[]];

  // Todo: use Align parameter.
  align;

  // TODO: group measurements by line
  for (const token of tokens) {
    for (const tag of token.tags) {
      if (tag.tagName === LINE_BREAK_TAG_NAME) {
        offset = updateOffsetForNewLine(offset, largestLineHeight, lineSpacing);
        currentLine += 1;
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
        currentLine += 1;
      }

      if (lines[currentLine] === undefined) {
        lines.push([]);
      }
      lines[currentLine].push(size);

      offset.x = size.right;

      measurements.push(size);
      previousMeasurement = size;
    }
  }

  const aligned = alignTextInLines(align, maxLineWidth, lines);

  return aligned.flat();
};
