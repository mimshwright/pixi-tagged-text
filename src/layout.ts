import { isTokenImage } from "./style";
import { IMG_STYLE_NAME } from "./Tags";
import { getFontPropertiesOfText } from "./pixiUtils";
import * as PIXI from "pixi.js";
import { LINE_BREAK_TAG_NAME } from "./tags";
import {
  Align,
  Measurement,
  MeasurementLine,
  MeasurementLines,
  Point,
  SpriteMap,
  TaggedTextToken,
  TaggedTextTokenPartial,
  VAlign,
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

const getTallestHeight = (line: MeasurementLine): number =>
  line.reduce((tallest, position) => Math.max(position.height, tallest), 0);

const getTallestToken = (line: TaggedTextToken[]): TaggedTextToken =>
  line.reduce(
    (tallest, current) => {
      if (
        (current.measurement?.height ?? 0) > (tallest?.measurement?.height ?? 0)
      ) {
        return current;
      }
      return tallest;
    },
    {
      text: "Tallest",
      tags: [],
      measurement: new PIXI.Rectangle(0, 0, 0, 0),
      style: {},
      fontProperties: { ascent: 0, descent: 0, fontSize: 0 },
    }
  );

export const valignTop = (line: MeasurementLine): MeasurementLine =>
  line.map((position: Measurement) => {
    const newPosition = position.clone();
    newPosition.y = 0;
    return newPosition;
  });

export const valignBottom = (line: MeasurementLine): MeasurementLine => {
  const tallestHeight = getTallestHeight(line);
  return line.map((position: Measurement) => {
    const newPosition = position.clone();
    newPosition.y = tallestHeight - newPosition.height;
    return newPosition;
  });
};

export const valignMiddle = (line: MeasurementLine): MeasurementLine => {
  const tallestHeight = getTallestHeight(line);
  return line.map((position: Measurement) => {
    const newPosition = position.clone();
    newPosition.y = (tallestHeight - newPosition.height) / 2;
    return newPosition;
  });
};

export const verticalAlignInLines = (
  lines: TaggedTextToken[][],
  lineSpacing: number,
  overrideValign?: VAlign
): TaggedTextToken[][] => {
  let previousTallestToken: TaggedTextToken = {
    text: "previousTallestToken",
    tags: [],
    measurement: new PIXI.Rectangle(0, 0, 0, 0),
    fontProperties: { ascent: 0, descent: 0, fontSize: 0 },
    style: {},
  };

  let previousY = 0;
  const newLines = [];

  for (const line of lines) {
    const newLine: TaggedTextToken[] = [];
    let tallestToken = getTallestToken(line);
    let tallestHeight;

    const previousTallestHeight = previousTallestToken.measurement.height;
    tallestHeight = tallestToken.measurement?.height ?? 0;

    if (line.length === 1 && line[0].text === "") {
      tallestHeight = previousTallestHeight;
    }

    if (tallestHeight === 0) {
      tallestToken = previousTallestToken;
    } else {
      previousTallestToken = tallestToken;
    }

    for (const word of line) {
      const {
        measurement: { x, y, width, height },
        fontProperties,
        style,
      } = word;
      const newMeasurement: Measurement = new PIXI.Rectangle(
        x,
        y,
        width,
        height
      );
      const valign = overrideValign ?? style.valign;
      const currentFontHeight = fontProperties?.ascent ?? 0;

      let newY = 0;
      switch (valign) {
        case "baseline":
          newY =
            previousY + tallestToken.fontProperties.ascent - currentFontHeight;
          break;
        case "bottom":
          newY = previousY + tallestHeight - fontProperties.fontSize;
          break;
        case "middle":
          newY = previousY + (tallestHeight - fontProperties.fontSize) / 2;
          break;
        case "top":
        default:
          newY = previousY;
      }

      newMeasurement.y = newY;

      const newWord = {
        ...word,
        measurement: newMeasurement,
      };
      newLine.push(newWord);
    }

    previousY += tallestHeight + lineSpacing;
    newLines.push(newLine);
  }

  return newLines;
};
// ? lines.map(valignTop)
//   : valign === "middle"
//   ? lines.map(valignMiddle)
//   : valign === "bottom"
//   ? lines.map(valignBottom)
//   : lines;

export const alignLeft = (line: MeasurementLine): MeasurementLine =>
  line.reduce(
    (allWords: MeasurementLine, { y, width, height }, i) =>
      i === 0
        ? [new PIXI.Rectangle(0, y, width, height)]
        : [
            ...allWords,
            new PIXI.Rectangle(
              allWords[i - 1].x + allWords[i - 1].width,
              y,
              width,
              height
            ),
          ],
    []
  );

export const alignRight = (maxWidth: number) => (
  line: MeasurementLine
): MeasurementLine =>
  translateLine({
    x: maxWidth - lineWidth(line),
    y: 0,
  })(line);

export const alignCenter = (maxWidth: number) => (
  line: MeasurementLine
): MeasurementLine =>
  translateLine({ x: center(lineWidth(line), maxWidth), y: 0 })(line);

export const alignJustify = (maxLineWidth: number) => (
  line: MeasurementLine
): MeasurementLine => {
  if (line.length === 0) {
    return [];
  }

  if (line.length === 1) {
    const { y, width, height } = line[0];
    return [new PIXI.Rectangle(0, y, width, height)];
  }

  const result: MeasurementLine = [];
  const w = lineWidth(line);
  const totalSpace = maxLineWidth - w;
  const spacerWidth = totalSpace / (line.length - 1);

  let previousWord;
  for (let i = 0; i < line.length; i++) {
    const { y, width, height } = line[i];
    let x;
    if (previousWord === undefined) {
      x = 0;
    } else {
      x = previousWord.right + spacerWidth;
    }
    const newWord: PIXI.Rectangle = new PIXI.Rectangle(x, y, width, height);
    previousWord = newWord;
    result[i] = newWord;
  }
  return result;
};

/**
 * Adjusts the values in the lines to match the current layout.
 */
export const alignTextInLines = (
  align: Align,
  maxLineWidth: number,
  lines: MeasurementLines
): MeasurementLines => {
  const output =
    align === "left"
      ? lines.map(alignLeft)
      : align === "right"
      ? lines.map(alignRight(maxLineWidth))
      : align === "center"
      ? lines.map(alignCenter(maxLineWidth))
      : align === "justify"
      ? lines.map(alignJustify(maxLineWidth))
      : lines;
  return output;
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
  tokens: TaggedTextTokenPartial[],
  spriteMap: SpriteMap,
  maxLineWidth: number = Number.POSITIVE_INFINITY,
  align: Align = "left",
  lineSpacing = 0
): TaggedTextToken[][] => {
  // Create a text field to use for measurements.
  const sizer = new PIXI.Text("");

  const lines: MeasurementLines = [[]];
  let previousMeasurement = new PIXI.Rectangle(0, 0, 0, 0);
  let largestLineHeight = 0;
  let offset = { x: 0, y: 0 };
  let currentLine = 0;
  let size;

  // TODO: group measurements by line
  for (const token of tokens) {
    for (const tag of token.tags) {
      if (isTokenImage(token)) {
        const src = token.style?.src;
        if (src === undefined) {
          throw new Error(
            `An image tag (<${tag.tagName}>) was used but there was no ${IMG_STYLE_NAME} defined for it. Either create a style or use a ${IMG_STYLE_NAME} attribute on the tag.`
          );
        }
        const sprite = spriteMap[src];
        if (sprite === undefined) {
          throw new Error(
            `An image tag (<${tag.tagName}>) with ${IMG_STYLE_NAME}="${src}" was encountered, but there was no matching sprite in the sprite map. Please include a valid Sprite in the spriteMap property in the options in your RichText constructor.`
          );
        }
        token.text = " ";
        token.sprite = sprite;
      }

      if (tag.tagName === LINE_BREAK_TAG_NAME) {
        offset = updateOffsetForNewLine(offset, largestLineHeight, lineSpacing);
        currentLine += 1;
        break;
      }
    }
    if (token.sprite === undefined && token.text === "") {
      continue;
    }

    sizer.text = token.text;
    sizer.style = {
      ...token.style,
      // Override some styles for the purposes of sizing text.
      wordWrap: false,
      dropShadowBlur: 0,
      dropShadowDistance: 0,
      dropShadowAngle: 0,
      dropShadow: false,
    };

    const fontProperties = getFontPropertiesOfText(sizer, true);
    token.fontProperties = fontProperties;

    largestLineHeight = Math.max(previousMeasurement.height, largestLineHeight);

    if (token.sprite !== undefined) {
      size = rectFromContainer(token.sprite, offset);
    } else {
      size = rectFromContainer(sizer, offset);
    }
    size.height = Math.max(size.height, fontProperties.fontSize);

    // if new size would exceed the max line width...
    if (size.right > maxLineWidth) {
      offset = updateOffsetForNewLine(offset, largestLineHeight, lineSpacing);
      size = rectFromContainer(sizer, offset);
      currentLine += 1;
    }

    if (lines[currentLine] === undefined) {
      lines[currentLine] = [];
    }
    lines[currentLine].push(size);

    offset.x = size.right;

    previousMeasurement = size;
  }

  const measurements = alignTextInLines(align, maxLineWidth, lines);
  // const valigned = verticalAlignInLines("bottom", aligned);
  // const finalMeasurements = valigned.flat();

  const filteredTokens = tokens.filter(({ text }) => text !== "");
  const measuredTokens: TaggedTextToken[][] = [];

  let i = 0;
  for (let line = 0; line < measurements.length; line++) {
    measuredTokens[line] = [];
    const measurementLine = measurements[line];

    if (measurementLine && measurementLine.length > 0) {
      for (let word = 0; word < measurementLine.length; word++) {
        const measurement = measurementLine[word];
        measuredTokens[line][word] = {
          ...filteredTokens[i],
          measurement,
        } as TaggedTextToken;
        i++;
      }
    }
  }
  // console.log(measuredTokens);

  if (measuredTokens.length === 0) {
    return measuredTokens;
  }
  const vAligned = verticalAlignInLines(measuredTokens, lineSpacing);

  return vAligned;
};
