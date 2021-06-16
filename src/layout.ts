import { extractDecorations } from "./style";
import { capitalize } from "./stringUtil";
import {
  last,
  first,
  assoc,
  mapProp,
  flatReduce,
  Unary,
} from "./functionalUtils";
import { getFontPropertiesOfText } from "./pixiUtils";
import * as PIXI from "pixi.js";
import {
  Align,
  Bounds,
  Point,
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
  isNotWhitespaceToken,
  VAlign,
  createEmptyFinalToken,
} from "./types";

const ICON_SCALE_BASE = 0.8;

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

/**
 * Move a point by an offset.
 * Point p => p -> p-> -> p
 * @param offset Amount to translate the target.
 * @param point Target to translate.
 */
export const translatePoint =
  <P extends Point>(offset: Point) =>
  (point: P): P => ({
    ...point,
    x: point.x + offset.x,
    y: point.y + offset.y,
  });

/**
 * Same as translatePoint but for all the points in an array.
 */
export const translateLine =
  (offset: Point) =>
  (line: Bounds[]): Bounds[] =>
    line.map(translatePoint(offset));

export const translateWordPosition =
  (offset: Point) =>
  (word: WordToken): WordToken =>
    word.map((token) =>
      mapProp<Bounds, FinalToken>("bounds")(translatePoint(offset))(token)
    );

export const translateTokenLine =
  (offset: Point) =>
  (line: LineToken): LineToken =>
    line.map(translateWordPosition(offset));

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

const setBoundsX = assoc<Bounds, number>("x");

const positionWordX =
  (x: number) =>
  (word: WordToken): WordToken => {
    let prevBounds: Bounds;
    return word.map((token) => {
      if (prevBounds === undefined) {
        token.bounds.x = x;
        prevBounds = token.bounds;
      } else {
        token.bounds.x = prevBounds.x + prevBounds.width;
        prevBounds = token.bounds;
      }
      return token;
    });
  };

export const concatBounds = (
  originalBounds: Bounds = { x: NaN, y: NaN, width: NaN, height: NaN },
  bounds: Bounds = { x: NaN, y: NaN, width: NaN, height: NaN }
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

const getCombinedBounds = (bounds: Bounds[]): Bounds =>
  bounds.reduce(concatBounds);

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

export const alignRight =
  (maxWidth: number) =>
  (line: Bounds[]): Bounds[] =>
    translateLine({
      x: maxWidth - lineWidth(line),
      y: 0,
    })(alignLeft(line));

export const alignCenter =
  (maxWidth: number) =>
  (line: Bounds[]): Bounds[] =>
    translateLine({ x: center(lineWidth(line), maxWidth), y: 0 })(
      alignLeft(line)
    );

export const alignJustify =
  (maxLineWidth: number) =>
  (line: Bounds[]): Bounds[] => {
    const count = line.length;
    if (count === 0) {
      return [];
    }

    const nonZeroWidthWords: Bounds[] = line.filter(({ width }) => width > 0);
    const countNonZeroWidthWords = nonZeroWidthWords.length;

    if (countNonZeroWidthWords === 1) {
      const [first, ...rest] = line;
      first.x = 0;
      return [first, ...rest];
    }

    const result: Bounds[] = [];
    const combinedBounds = getCombinedBounds(nonZeroWidthWords);
    const w = combinedBounds.width;
    const totalSpace = maxLineWidth - w;
    const spacerWidth = totalSpace / (countNonZeroWidthWords - 1);

    let previousWord;
    for (let i = 0; i < line.length; i++) {
      const bounds = line[i];
      if (bounds.width === 0) {
        result[i] = { ...bounds };
        continue;
      }
      let x;
      if (previousWord === undefined) {
        x = 0;
      } else {
        x = previousWord.x + previousWord.width + spacerWidth;
      }
      if (isNaN(x)) {
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

export const alignLines = (
  align: Align,
  maxWidth: number,
  lines: ParagraphToken
): ParagraphToken => {
  // do horizontal alignment.
  let alignFunction: (l: Bounds[]) => Bounds[];
  switch (align) {
    case "left":
      alignFunction = alignLeft;
      break;
    case "right":
      alignFunction = alignRight(maxWidth);
      break;
    case "center":
      alignFunction = alignCenter(maxWidth);
      break;
    case "justify":
      alignFunction = alignJustify(maxWidth);
      break;
    default:
      throw new Error(
        `Unsupported alignment type ${align}! Use one of : "left", "right", "center", "justify"`
      );
  }

  for (const line of lines) {
    const wordBoundsForLine: Bounds[] = [];
    for (const word of line) {
      const wordBounds = getBoundsNested(word);
      wordBoundsForLine.push(wordBounds);
      if (isNaN(wordBounds.x)) {
        throw new Error("wordBounds not correct");
      }
    }
    const alignedLine = alignFunction(wordBoundsForLine);
    for (let i = 0; i < line.length; i++) {
      const bounds = alignedLine[i];
      const word = line[i];
      line[i] = positionWordX(bounds.x)(word);
    }
  }
  return lines;
};

const getTallestToken = (line: LineToken): FinalToken =>
  flatReduce<FinalToken, FinalToken>((tallest, current) => {
    let h = current.bounds.height ?? 0;
    if (isSpriteToken(current)) {
      h += current.fontProperties.descent;
    }
    if (h > (tallest?.bounds.height ?? 0)) {
      return current;
    }
    return tallest;
  }, createEmptyFinalToken())(line);

/**
 * @param If you want to override the valign from the styles object, set it here.
 */
export const verticalAlignInLines = (
  lines: ParagraphToken,
  lineSpacing: number,
  overrideValign?: VAlign
): ParagraphToken => {
  let previousTallestToken: FinalToken = createEmptyFinalToken();

  let previousLineBottom = 0;
  const newLines: ParagraphToken = [];

  for (const line of lines) {
    const newLine: LineToken = [];
    // const nonZeroWidthWords: Bounds[] = line.filter(({ width }) => width > 0);

    let tallestToken: FinalToken = getTallestToken(line);
    let tallestHeight = tallestToken.bounds?.height ?? 0;
    let tallestAscent = tallestToken.fontProperties?.ascent ?? 0;
    if (isSpriteToken(tallestToken)) {
      tallestHeight += tallestToken.fontProperties.descent;
      tallestAscent = tallestToken.bounds.height;
    }

    // const previousTallestHeight = previousTallestToken.bounds.height;

    // if (line.length === 1 && isWhitespaceToken(line[0])) {
    //   tallestHeight = previousTallestHeight;
    // }

    if (tallestHeight === 0) {
      tallestToken = previousTallestToken;
    } else {
      previousTallestToken = tallestToken;
    }

    for (const word of line) {
      const newWord: WordToken = [];
      for (const segment of word) {
        if (isNewlineToken(segment)) {
          const newToken = {
            ...segment,
          };
          newWord.push(newToken);
          continue;
        }
        const { bounds, fontProperties, style } = segment;
        const height = bounds.height;

        const newBounds: Bounds = { ...bounds };
        const valign = overrideValign ?? style.valign;

        let { ascent } = fontProperties;
        if (isSpriteToken(segment)) {
          ascent = segment.bounds.height;
        }

        let newY = 0;
        switch (valign) {
          case "bottom":
            newY = previousLineBottom + tallestHeight - height;
            break;
          case "middle":
            newY = previousLineBottom + (tallestHeight - height) / 2;
            break;
          case "top":
            newY = previousLineBottom;
            break;
          case "baseline":
          default:
            newY = previousLineBottom + tallestAscent - ascent;
        }

        newBounds.y = newY;

        const newToken = {
          ...segment,
          bounds: newBounds,
        };
        newWord.push(newToken);
      }
      newLine.push(newWord);
    }

    previousLineBottom += tallestHeight + lineSpacing;
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

export const collapseWhitespacesOnEndOfLines = (
  lines: ParagraphToken
): ParagraphToken => {
  for (const line of lines) {
    const l = line.length;
    let i = l;
    while (i >= 0) {
      i -= 1;
      const word = line[i];
      if (isNotWhitespaceToken(word)) {
        break;
      } else {
        for (const token of word) {
          token.bounds.width = 0;
          token.bounds.height = Math.min(
            token.bounds.height,
            token.fontProperties.fontSize
          );
        }
      }
    }
  }
  return lines;
};

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
    if (word !== undefined && word.length > 0) {
      // add word to line
      line.push(word);
    }

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
  const collapsedWhitespace = collapseWhitespacesOnEndOfLines(lines);
  const alignedLines = alignLines(align, maxWidth, collapsedWhitespace);
  const valignedLines = verticalAlignInLines(alignedLines, lineSpacing);

  return valignedLines;
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

  let fontProperties: PIXI.IFontMetrics;

  const generateFinalTokenFromStyledToken =
    (style: TextStyleExtended, tags: string) =>
    (token: StyledToken | TextToken | SpriteToken): FinalToken[] => {
      let output: FinalToken[] = [];

      sizer.style = {
        ...style,
        // Override some styles for the purposes of sizing text.
        wordWrap: false,
        dropShadowBlur: 0,
        dropShadowDistance: 0,
        dropShadowAngle: 0,
        dropShadow: false,
      };

      if (typeof token === "string") {
        // split into pieces and convert into tokens.

        const textSegments = splitText(token, splitStyle);

        const textTokens = textSegments.map((str): FinalToken => {
          switch (style.textTransform) {
            case "uppercase":
              sizer.text = str.toUpperCase();
              break;
            case "lowercase":
              sizer.text = str.toLowerCase();
              break;
            case "capitalize":
              sizer.text = capitalize(str);
              break;
            default:
              sizer.text = str;
          }

          fontProperties = { ...getFontPropertiesOfText(sizer, true) };
          const bounds = rectFromContainer(sizer);

          // Incorporate the size of the stroke into the size of the text.
          const stroke = sizer.style.strokeThickness ?? 0;
          if (stroke > 0) {
            fontProperties.descent += stroke / 2;
            fontProperties.ascent += stroke / 2;
            fontProperties.fontSize =
              fontProperties.ascent + fontProperties.descent;
          }

          const textDecorations = extractDecorations(
            style,
            bounds,
            fontProperties
          );

          return {
            content: str,
            style,
            tags,
            bounds,
            fontProperties,
            textDecorations,
          };
        });

        output = output.concat(textTokens);
      } else if (token instanceof PIXI.Sprite) {
        const sprite = token;
        const imgDisplay = style[IMG_DISPLAY_PROPERTY];
        // const isBlockImage = imgDisplay === "block";
        const isIcon = imgDisplay === "icon";
        fontProperties = { ...getFontPropertiesOfText(sizer, true) };

        if (isIcon) {
          // Set to minimum of 1 to avoid devide by zero.
          // if it's height is zero or one it probably hasn't loaded yet.
          // It will get refreshed after it loads.
          const h = Math.max(sprite.height, 1);

          if (h > 1 && sprite.scale.y === 1) {
            const ratio = (fontProperties.ascent / h) * ICON_SCALE_BASE;
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
          textDecorations: [],
        });
      } else {
        // token is a composite
        const styledToken = token as StyledToken;
        const { children } = styledToken;
        // set tags and styles for children of this composite token.
        const newStyle = styledToken.style;
        const newTags = styledToken.tags;

        if (newStyle === undefined) {
          throw new Error(
            `Expected to find a 'style' property on ${styledToken}`
          );
        }

        output = output.concat(
          children.flatMap(generateFinalTokenFromStyledToken(newStyle, newTags))
        );
      }
      return output;
    };

  // when starting out, use the default style
  const tags = "";
  const style: TextStyleExtended = defaultStyle;

  const finalTokens = styledTokens.children.flatMap(
    generateFinalTokenFromStyledToken(style, tags)
  );

  const maxWidth = defaultStyle.wordWrapWidth ?? Number.POSITIVE_INFINITY;
  const lineSpacing = defaultStyle.lineSpacing ?? 0;
  const align = defaultStyle.align ?? "left";

  const lines = layout(finalTokens, maxWidth, lineSpacing, align);

  return lines;
};
