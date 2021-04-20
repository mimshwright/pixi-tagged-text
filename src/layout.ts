import {
  last,
  first,
  assoc,
  mapProp,
  flatReduce,
  Unary,
} from "./functionalUtils";
import { getFontPropertiesOfText, INITIAL_FONT_PROPS } from "./pixiUtils";
import * as PIXI from "pixi.js";
import {
  Align,
  Bounds,
  Point,
  // VAlign,
  // IMG_DISPLAY_PROPERTY,
  StyledTokens,
  FinalToken,
  StyledToken,
  TextToken,
  SpriteToken,
  SplitStyle,
  TextStyleExtended,
  isNewlineToken,
  isWhitespaceToken,
  IMG_DISPLAY_PROPERTY,
  isSpriteToken,
  ParagraphToken,
  LineToken,
  WordToken,
  Nested,
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
): Bounds => {
  const w = container.width;
  const h = container.height;
  const x = offset.x + container.x;
  const y = offset.y + container.y;

  return new PIXI.Rectangle(x, y, w, h);
};

// const setPoint = <P extends Point>(position: Point) => (point: P): P => ({
//   ...point,
//   x: position.x,
//   y: position.y,
// });

/**
 * Move a point by an offset.
 * Point p => p -> p-> -> p
 * @param offset Amount to translate the target.
 * @param point Target to translate.
 */
export const translatePoint = <P extends Point>(offset: Point) => (
  point: P
): P => ({
  ...point,
  x: point.x + offset.x,
  y: point.y + offset.y,
});

/**
 * Same as translatePoint but for all the points in an array.
 */
export const translateLine = (offset: Point) => (line: Bounds[]): Bounds[] =>
  line.map(translatePoint(offset));

export const translateWord = (offset: Point) => (word: WordToken): WordToken =>
  word.map((token) =>
    mapProp<Bounds, FinalToken>("bounds")(translatePoint(offset))(token)
  );

export const translateTokenLine = (offset: Point) => (
  line: LineToken
): LineToken => line.map(translateWord(offset));

export const lineWidth = (wordsInLine: Bounds[]): number => {
  const firstWord = first(wordsInLine);
  const lastWord = last(wordsInLine);

  if (firstWord === undefined) {
    return 0;
  }
  if (lastWord === firstWord) {
    return firstWord.width;
  }
  return lastWord.x + lastWord.width - firstWord.x;
};

export const center = (x: number, context: number): number => (context - x) / 2;

/*
const getTallestToken = (line: FinalToken[]): FinalToken =>
  line.reduce(
    (tallest, current) => {
      if ((current.bounds.height ?? 0) > (tallest?.bounds.height ?? 0)) {
        return current;
      }
      return tallest;
    },
    {
      content: "No Tokens on this line with height > 0.",
      tags: "",
      bounds: new PIXI.Rectangle(0, 0, 0, 0),
      style: {},
      fontProperties: { ascent: 0, descent: 0, fontSize: 0 },
    }
  );
  */

/*
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

      const newMeasurement: Bounds = new PIXI.Rectangle(x, y, width, height);
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

  // ? lines.map(valignTop)
  //   : valign === "middle"
  //   ? lines.map(valignMiddle)
  //   : valign === "bottom"
  //   ? lines.map(valignBottom)
  //   : lines;
};
*/

/*
export const alignLeft = (line: LineToken): LineToken =>
  line.map((word) => {
    let previousSegment: FinalToken;
    return word.map((segment, i) => {
      const x = previousSegment
        ? previousSegment.bounds.x + previousSegment.bounds.width
        : 0;
      const newSegment = { ...segment, bounds: { ...segment.bounds, x } };
      previousSegment = segment;
      return newSegment;
    });
  });
  */

const setBoundsX = assoc<Bounds, number>("x");

// const positionWordX = (x: number) => (word: WordToken): WordToken => {
//   let prevBounds: Bounds;
//   return word.map((token) => {
//     if (prevBounds === undefined) {
//       token.bounds.x = x;
//       prevBounds = token.bounds;
//     } else {
//       token.bounds.x = prevBounds.x + prevBounds.width;
//     }
//     return token;
//   });
// };

export const concatBounds = (
  originalBounds: Bounds,
  bounds: Bounds
): Bounds => {
  if (isNaN(originalBounds.x)) {
    return bounds;
  }

  const x = Math.min(originalBounds.x, bounds.x);
  const y = Math.min(originalBounds.y, bounds.y);
  const right = Math.max(
    originalBounds.x + originalBounds.width,
    bounds.x + bounds.width
  );
  const bottom = Math.max(
    originalBounds.y + originalBounds.height,
    bounds.y + bounds.height
  );
  const width = right - x;
  const height = bottom - y;

  return { x, y, width, height };
};

export const getBoundsNested: Unary<Nested<FinalToken>, Bounds> = flatReduce<
  FinalToken,
  Bounds
>((acc: Bounds, t: FinalToken) => concatBounds(acc, t.bounds), {
  x: NaN,
  y: NaN,
  width: NaN,
  height: NaN,
});

export const alignLeft = (line: Bounds[]): Bounds[] =>
  line.reduce(
    (newLine: Bounds[], bounds: Bounds, i: number): Bounds[] =>
      // is first word?
      i === 0
        ? [setBoundsX(0)(bounds)]
        : newLine.concat([
            setBoundsX(newLine[i - 1].x + newLine[i - 1].width)(bounds),
          ]),
    []
  );

// export const alignLeft = (line: WordToken[]): WordToken[] => {
//   let previousWordBounds: Bounds;
//   return line.map((word: WordToken) => {
//     // is first word?
//     if (previousWordBounds === undefined) {
//       positionWordX(0)(word);
//     } else {
//       positionWordX(previousWordBounds.x + previousWordBounds.width);
//     }
//     previousWordBounds = getWordBounds(word);
//     return word;
//   });
// };

export const alignRight = (maxWidth: number) => (line: Bounds[]): Bounds[] =>
  translateLine({
    x: maxWidth - lineWidth(line),
    y: 0,
  })(alignLeft(line));

// export const alignRight = (maxWidth: number) => (line: LineToken): LineToken =>
//   translateTokenLine({
//     x: maxWidth - getLineBounds(line).width,
//     y: 0,
//   })(alignLeft(line));

export const alignCenter = (maxWidth: number) => (line: Bounds[]): Bounds[] =>
  translateLine({ x: center(lineWidth(line), maxWidth), y: 0 })(
    alignLeft(line)
  );

// export const alignCenter = (maxWidth: number) => (line: LineToken): LineToken =>
//   translateTokenLine({
//     x: center(getLineBounds(line).width, maxWidth),
//     y: 0,
//   })(alignLeft(line));

export const alignJustify = (maxLineWidth: number) => (
  line: Bounds[]
): Bounds[] => {
  if (line.length === 0) {
    return [];
  }

  if (line.length === 1) {
    const bounds = line[0];
    return [setBoundsX(0)(bounds)];
  }

  const result: Bounds[] = [];
  const w = lineWidth(line);
  const totalSpace = maxLineWidth - w;
  const spacerWidth = totalSpace / (line.length - 1);

  let previousWord;
  for (let i = 0; i < line.length; i++) {
    const bounds = line[i];
    let x;
    if (previousWord === undefined) {
      x = 0;
    } else {
      x = previousWord.x + previousWord.width + spacerWidth;
    }
    if (isNaN(x)) {
      console.log(line);
      console.log(previousWord);

      throw new Error(
        `Something went wrong with the justified layout calculation. x is NaN.`
      );
    }
    const newWord: Bounds = setBoundsX(x)(bounds);
    previousWord = newWord;
    result[i] = newWord;
  }
  return result;
};

const alignLines = (
  align: Align,
  maxWidth: number,
  lines: ParagraphToken
): ParagraphToken => {
  // do horizontal alignment.
  // let alignFunction: (l: Bounds[]) => Bounds[];
  // switch (align) {
  //   case "left":
  //     alignFunction = alignLeft;
  //     break;
  //   case "right":
  //     alignFunction = alignRight(maxWidth);
  //     break;
  //   case "center":
  //     alignFunction = alignCenter(maxWidth);
  //     break;
  //   case "justify":
  //     // alignFunction = alignJustify(maxWidth);
  //     alignFunction = alignCenter(maxWidth);
  //     break;
  //   default:
  //     throw new Error(
  //       `Unsupported alignment type ${align}! Use one of : "left", "right", "center", "justify"`
  //     );
  // }

  // lines.map(
  //   line =>
  // )

  // const alignedLines = lines.map(line => line.map(
  //   word => word.map(
  //     token
  //   )
  // )
  //   );

  // return lines.map(alignFunction);

  return lines;
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
/*
export const calculateMeasurementsOld = (
  tokens: TaggedTextTokenPartial[],
  maxLineWidth: number = Number.POSITIVE_INFINITY,
  align: Align = "left",
  lineSpacing = 0
): TaggedTextToken[][] => {
  // Create a text field to use for measurements.
  const sizer = new PIXI.Text("");

  const lines: MeasurementLines = [[]];
  let previousMeasurement = new PIXI.Rectangle(0, 0, 0, 0);
  let previousToken = undefined;
  let previousSpaceWidth = 0;
  let largestLineHeight = 0;
  let offset = { x: 0, y: 0 };
  let currentLine = 0;
  let size;

  function goToNextLine() {
    offset = updateOffsetForNewLine(offset, largestLineHeight, lineSpacing);
    currentLine += 1;
    if (lines[currentLine] === undefined) {
      lines[currentLine] = [];
    }
  }

  function isNewline(token: TaggedTextTokenPartial): boolean {
    return token.tags[0]?.tagName === LINE_BREAK_TAG_NAME;
  }

  // TODO: group measurements by line
  for (const token of tokens) {
    const sprite = token.sprite;
    const isImage = sprite !== undefined;
    const imgDisplay = token.style?.[IMG_DISPLAY_PROPERTY];
    const isBlockImage = imgDisplay === "block";
    const isIcon = imgDisplay === "icon";

    if (isNewline(token) || isBlockImage) {
      goToNextLine();
      token.text = " ";
    } else if (previousToken && isNewline(previousToken)) {
      // only create a tag out of this if it's the only thing on the line.
      previousMeasurement.width = 0;
    }
    if (isImage === false && token.text === "") {
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
      goToNextLine();

      size = rectFromContainer(sizer, offset);
      if (previousToken?.text.endsWith(" ")) {
        previousMeasurement.width -= previousSpaceWidth;
      }
    }

    lines[currentLine].push(size);

    offset.x = size.right;

    previousMeasurement = size;
    previousSpaceWidth = spaceWidth;
    previousToken = token;
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

*/

const layout = (
  tokens: FinalToken[],
  maxWidth: number,
  lineSpacing: number,
  align: Align
): ParagraphToken => {
  const cursor = { x: 0, y: 0 };
  let wordWidth = 0;
  let word: WordToken = [];
  let line: LineToken = [];
  const lines: ParagraphToken = [];
  let tallestHeight = 0;

  function finalizeLineAndMoveCursorToNextLine() {
    // finalize Line
    lines.push(line);
    line = [];

    // move cursor to next line
    cursor.x = 0;
    cursor.y = cursor.y + tallestHeight;

    // reset tallestHeight
    tallestHeight = 0;
  }

  function setTallestHeight(token: FinalToken): void {
    tallestHeight = Math.max(
      tallestHeight,
      token.fontProperties.fontSize,
      lineSpacing
    );
    // Don't try to measure the height of newline tokens
    if (isNewlineToken(token) === false) {
      tallestHeight = Math.max(tallestHeight, token.bounds.height);
    }
  }

  function positionTokenAtCursorAndAdvanceCursor(token: FinalToken): void {
    // position token at cursor
    setTallestHeight(token);
    token.bounds.x = cursor.x;
    token.bounds.y = cursor.y;
    // advance cursor
    cursor.x += token.bounds.width;
  }

  function positionWordAtCursorAndAdvanceCursor(): void {
    word.forEach(positionTokenAtCursorAndAdvanceCursor);
  }

  function wordShouldWrap(): boolean {
    return cursor.x + wordWidth > maxWidth;
  }

  function isBlockImage(token: FinalToken): boolean {
    return token.style[IMG_DISPLAY_PROPERTY] === "block";
  }

  function addTokenToWord(token: FinalToken): void {
    // add the token to the current word buffer.
    word.push(token);
    wordWidth += token.bounds.width;
  }

  function finalizeWord() {
    // add word to line
    line.push(word);

    // reset word buffer
    word = [];
    wordWidth = 0;
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isLastToken = i === tokens.length - 1;
    const isWhitespace = isWhitespaceToken(token);
    const isImage = isSpriteToken(token);
    const isEndOfWord = isWhitespace || isImage;

    setTallestHeight(token);

    // the current word is finished, position the segments in the word buffer.
    if (isEndOfWord) {
      // if it exceeds the wrap width, wrap it to next line.
      // Note, the word will only move to the next line once when it encounters an end of word token like a space or image.
      if (wordShouldWrap()) {
        finalizeLineAndMoveCursorToNextLine();
      }

      // move the word segments to the cursor location
      positionWordAtCursorAndAdvanceCursor();

      finalizeWord();
    }

    setTallestHeight(token);
    addTokenToWord(token);

    if (isWhitespace) {
      // position the whitespace.
      positionTokenAtCursorAndAdvanceCursor(token);

      finalizeWord();

      // If the token is a newline character,
      // move the cursor to next line.
      if (isNewlineToken(token)) {
        finalizeLineAndMoveCursorToNextLine();
      }
    } else {
      // if non-whitespace...

      if (isImage) {
        if (isBlockImage(token)) {
          finalizeLineAndMoveCursorToNextLine();
          positionWordAtCursorAndAdvanceCursor();
        }
      }
      if (isLastToken) {
        positionWordAtCursorAndAdvanceCursor();
        line.push(word);
        lines.push(line);
      }
    }
  }

  const alignedLines = alignLines(align, maxWidth, lines);

  return alignedLines;
};

const notEmptyString = (s: string) => s !== "";

const SPLIT_MARKER = `_🔪_`;
export const splitAroundWhitespace = (s: string): string[] =>
  s
    .replace(/\s/g, `${SPLIT_MARKER}$&${SPLIT_MARKER}`)
    .split(SPLIT_MARKER)
    .filter((s) => s !== "");

export const splitText = (s: string, splitStyle: SplitStyle): string[] => {
  if (splitStyle === "words") {
    return [s].flatMap(splitAroundWhitespace).filter(notEmptyString);
  } else if (splitStyle === "characters") {
    return s.split("");
  } else {
    // unsupported splitStyle.
    let suggestion = ` Supported styles are "words" and "characters"`;
    const badStyle = (splitStyle as string).toLowerCase();
    if (badStyle.indexOf("char") === 0) {
      suggestion = `Did you mean "characters"?`;
    } else if (badStyle.indexOf("wor") === 0) {
      suggestion = `Did you mean "words"?`;
    }
    throw new Error(`Unsupported split style "${splitStyle}". ${suggestion}`);
  }
};

export const calculateFinalTokens = (
  styledTokens: StyledTokens,
  splitStyle: SplitStyle = "words"
): ParagraphToken => {
  // Create a text field to use for measurements.
  const sizer = new PIXI.Text("");
  const defaultStyle = styledTokens.style;

  let tags = "";
  let style: TextStyleExtended = defaultStyle;
  let fontProperties: PIXI.IFontMetrics = INITIAL_FONT_PROPS;

  const generateFinalTokenFromStyledToken = (
    token: StyledToken | TextToken | SpriteToken
  ): FinalToken[] => {
    let output: FinalToken[] = [];

    if (typeof token === "string") {
      // split into pieces and convert into tokens.

      const textSegments = splitText(token, splitStyle);

      // console.log({ input: token, output: textSegments });

      sizer.style = {
        ...style,
        // Override some styles for the purposes of sizing text.
        wordWrap: false,
        dropShadowBlur: 0,
        dropShadowDistance: 0,
        dropShadowAngle: 0,
        dropShadow: false,
      };
      fontProperties = getFontPropertiesOfText(sizer, true);

      const textTokens = textSegments.map(
        (str): FinalToken => {
          sizer.text = str;
          const bounds = rectFromContainer(sizer);
          return {
            content: str,
            style,
            tags,
            bounds,
            fontProperties,
          };
        }
      );

      output = output.concat(textTokens);
    } else if (token instanceof PIXI.Sprite) {
      const sprite = token;
      const imgDisplay = style[IMG_DISPLAY_PROPERTY];
      // const isBlockImage = imgDisplay === "block";
      const isIcon = imgDisplay === "icon";

      if (isIcon) {
        // Set to minimum of 1 to avoid devide by zero.
        // if it's height is zero or one it probably hasn't loaded yet.
        // It will get refreshed after it loads.
        const h = Math.max(sprite.height, 1);

        if (h > 1 && sprite.scale.y === 1) {
          const ratio = fontProperties.ascent / h;
          sprite.scale.set(ratio);
        }
      }

      // handle images
      const bounds = rectFromContainer(sprite);
      output.push({
        content: sprite,
        style,
        tags,
        bounds,
        fontProperties,
      });
    } else {
      // token is a composite
      const styledToken = token as StyledToken;
      const { children } = styledToken;

      // set tags and styles for children of this composite token.
      style = styledToken.style;
      tags = styledToken.tags;

      if (style === undefined) {
        throw new Error(
          `Expected to find a 'style' property on ${styledToken}`
        );
      }

      output = output.concat(
        children.flatMap(generateFinalTokenFromStyledToken)
      );

      // unset tags and styles for this composite token.
      style = defaultStyle;
      tags = "";
    }
    return output;
  };

  const finalTokens = styledTokens.children.flatMap(
    generateFinalTokenFromStyledToken
  );

  const maxWidth = defaultStyle.wordWrapWidth ?? Number.POSITIVE_INFINITY;
  const lineSpacing = defaultStyle.lineSpacing ?? 0;
  const align = defaultStyle.align ?? "left";

  const lines = layout(finalTokens, maxWidth, lineSpacing, align);

  return lines;
};
