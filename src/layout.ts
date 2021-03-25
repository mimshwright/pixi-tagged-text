import { isTokenImage } from "./style";
import { cloneSprite, getFontPropertiesOfText } from "./pixiUtils";
import * as PIXI from "pixi.js";
import {
  Align,
  Measurement,
  MeasurementLine,
  MeasurementLines,
  Point,
  ImageMap,
  TaggedTextToken,
  TaggedTextTokenPartial,
  VAlign,
  LINE_BREAK_TAG_NAME,
  IMG_SRC_PROPERTY,
  IMG_DISPLAY_PROPERTY,
} from "./types";

/**
 * Translates the current location point to the beginning of the next line.
 *
 * @param offset An offset coordinate. The function will make a clone of this with new coordinates.
 * @param largestLineHeight The largest height in the line of text.
 * @param lineSpacing The amount of extra space to insert between each line.
 */
export const updateOffsetForNewLine = (
  offset: Point,
  largestLineHeight: number,
  lineSpacing: number
): Point => new PIXI.Point(0, offset.y + largestLineHeight + lineSpacing);

const rectFromContainer = (
  container: PIXI.Container,
  offset: Point = { x: 0, y: 0 }
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
      text: "No Tokens on this line with height > 0.",
      tags: [],
      measurement: new PIXI.Rectangle(0, 0, 0, 0),
      style: {},
      fontProperties: { ascent: 0, descent: 0, fontSize: 0 },
    }
  );

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
        sprite,
      } = word;

      const newMeasurement: Measurement = new PIXI.Rectangle(
        x,
        y,
        width,
        height
      );
      const valign = overrideValign ?? style.valign;

      const elementAscent =
        sprite !== undefined ? height : fontProperties?.ascent ?? 0;
      const elementHeight =
        sprite !== undefined ? height : fontProperties.fontSize;

      let newY = 0;
      switch (valign) {
        case "bottom":
          newY = previousY + tallestHeight - elementHeight;
          break;
        case "middle":
          newY = previousY + (tallestHeight - elementHeight) / 2;
          break;
        case "top":
          newY = previousY;
          break;
        case "baseline":
        default:
          newY = previousY + tallestHeight - elementAscent;
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
 * @param imgMap A mapping of image keys to template Sprite objects
 * @param maxLineWidth The maximum width of one line of text.
 * @param tagStyles List of tagStyles to use for calculating text size.
 * @param align Alignment of text.
 * @param lineSpacing Number of pixels between each line of text.
 * @returns Array of Rectangle objects pertaining to each piece of text.
 */
export const calculateMeasurements = (
  tokens: TaggedTextTokenPartial[],
  imgMap: ImageMap,
  maxLineWidth: number = Number.POSITIVE_INFINITY,
  align: Align = "left",
  lineSpacing = 0
): TaggedTextToken[][] => {
  // Create a text field to use for measurements.
  const sizer = new PIXI.Text("");

  const lines: MeasurementLines = [[]];
  let previousMeasurement = new PIXI.Rectangle(0, 0, 0, 0);
  let previousSpaceWidth = 0;
  let largestLineHeight = 0;
  let offset = { x: 0, y: 0 };
  let currentLine = 0;
  let size;

  // TODO: group measurements by line
  for (const token of tokens) {
    const isImage = isTokenImage(token);
    let isBlockImage = false;
    let isIcon = false;
    let sprite;
    for (const tag of token.tags) {
      if (isImage) {
        const src = token.style?.[IMG_SRC_PROPERTY] as string;
        sprite = cloneSprite(imgMap[src]);
        if (sprite === undefined) {
          throw new Error(
            `An image tag (<${tag.tagName}>) with ${IMG_SRC_PROPERTY}="${src}" was encountered, but there was no matching sprite in the sprite map. Please include a valid Sprite in the imgMap property in the options in your RichText constructor.`
          );
        }
        if (token.text !== "" && token.text !== " ") {
          console.error(
            `Encountered tag <${tag.tagName}> which is recognized as an image tag ("${src}") but also contains the text "${token.text}". Text inside of image tags is not currently supported and has been removed.`
          );
        }
        token.text = " ";
        token.sprite = sprite;

        isBlockImage = token.style?.[IMG_DISPLAY_PROPERTY] === "block";
        isIcon = token.style?.[IMG_DISPLAY_PROPERTY] === "icon";
      }

      if (tag.tagName === LINE_BREAK_TAG_NAME || isBlockImage) {
        offset = updateOffsetForNewLine(offset, largestLineHeight, lineSpacing);
        currentLine += 1;
        break;
      }
    }
    if (token.sprite === undefined && token.text === "") {
      continue;
    }

    sizer.style = {
      ...token.style,
      // Override some styles for the purposes of sizing text.
      wordWrap: false,
      dropShadowBlur: 0,
      dropShadowDistance: 0,
      dropShadowAngle: 0,
      dropShadow: false,
    };

    // Measure a space character in this font style.
    sizer.text = " ";
    const spaceWidth = sizer.width;

    sizer.text = token.text;

    const fontProperties = getFontPropertiesOfText(sizer, true);
    token.fontProperties = fontProperties;

    largestLineHeight = Math.max(previousMeasurement.height, largestLineHeight);

    if (sprite) {
      if (isIcon) {
        const h = sprite?.height ?? -1;

        // if it's height is zero or one it probably hasn't loaded yet.
        if (h > 1 && sprite.scale.y === 1) {
          const ratio = fontProperties.ascent / h;
          // console.log(
          //   `Setting scale to ${fontProperties.ascent}/${h}=${ratio}`
          // );

          sprite?.scale.set(ratio);
        }
      }

      size = rectFromContainer(sprite, offset);
    } else {
      size = rectFromContainer(sizer, offset);
      size.height = Math.max(size.height, fontProperties.fontSize);
    }

    // if new size would exceed the max line width...
    if (size.right > maxLineWidth) {
      offset = updateOffsetForNewLine(offset, largestLineHeight, lineSpacing);
      size = rectFromContainer(sizer, offset);
      currentLine += 1;
      previousMeasurement.width -= previousSpaceWidth;
    }

    if (lines[currentLine] === undefined) {
      lines[currentLine] = [];
    }
    lines[currentLine].push(size);

    offset.x = size.right;

    previousMeasurement = size;
    previousSpaceWidth = spaceWidth;
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
