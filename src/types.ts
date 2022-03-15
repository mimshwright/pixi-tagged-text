import * as PIXI from "pixi.js";
import TaggedText from "./TaggedText";
import { complement, flatEvery } from "./functionalUtils";
import { logWarning } from "./errorMessaging";

///// GENERAL PURPOSE

export type Point = {
  x: number;
  y: number;
};
export type Rectangle = Point & {
  width: number;
  height: number;
};

export type Bounds = Rectangle;

export type Nested<T> = T | Array<Nested<T>>;

export type ErrorMessageType = "warning" | "error";
export interface ErrorMessage {
  type: ErrorMessageType;
  code: string;
  message: string;
  target?: TaggedText;
}

///// OPTIONS

export type SpriteSource =
  | string
  | PIXI.Texture
  | HTMLCanvasElement
  | HTMLVideoElement;

export type TextureSource =
  | string
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | PIXI.BaseTexture;

export type ImageSource = PIXI.Sprite | SpriteSource | TextureSource;

export const isSpriteSource = (s: ImageSource): s is SpriteSource =>
  typeof s === "string" ||
  s instanceof PIXI.Texture ||
  s instanceof HTMLCanvasElement ||
  s instanceof HTMLVideoElement;
export const isTextureSource = (s: ImageSource): s is TextureSource =>
  s instanceof HTMLImageElement || s instanceof PIXI.BaseTexture;

export type FontProperty = string | number;
export type FontMap = Record<string, FontProperty>;

export type ImageSourceMap = Record<string, ImageSource>;
export type ImageMap = Record<string, PIXI.Sprite>;

export type SplitStyle = "words" | "characters";

export type ErrorHandler = (e: ErrorMessage) => void;
export interface TaggedTextOptions {
  debug?: boolean;
  debugConsole?: boolean;
  splitStyle?: SplitStyle;
  adjustFontBaseline?: FontMap;
  imgMap?: ImageSourceMap;
  scaleIcons?: boolean;
  skipUpdates?: boolean;
  skipDraw?: boolean;
  drawWhitespace?: boolean;
  wrapEmoji?: boolean;
  errorHandler?: ErrorHandler;
  supressConsole?: boolean;
}

///// STYLE PROPERTIES

// PROPERTY NAMES
export const IMG_REFERENCE_PROPERTY = "imgSrc";
export const IMG_DISPLAY_PROPERTY = "imgDisplay";

export enum MeasurementUnit {
  default = "px",
  px = "px",
  em = "em",
  rem = "rem",
  pt = "pt",
  pc = "pc",
  in = "in",
  cm = "cm",
  mm = "mm",
  percent = "%",
  unknown = "unknown",
}

export const DEFAULT_MEASUREMENT_UNIT: MeasurementUnit =
  MeasurementUnit.default;

export interface MeasurementComponents {
  value: number;
  unit: MeasurementUnit;
}

export type MeasurementValue = string | number;

export type Thickness = number;
export type Color = string | number;
export type FontSize = MeasurementValue;
export type Fill = Color | string[] | number[] | CanvasGradient | CanvasPattern;
export type VAlign = "top" | "middle" | "bottom" | "baseline" | number;
export type AlignClassic = "left" | "right" | "center" | "justify";
export type Align =
  | AlignClassic
  | "justify"
  | "justify-left"
  | "justify-right"
  | "justify-center"
  | "justify-all";
export type ImageDisplayMode = "icon" | "block" | "inline";
export type ImageReference = string;
export type ImageDimensionPercentage = string;
export type ImageDimension = number | string | ImageDimensionPercentage;
export type TextTransform = "normal" | "capitalize" | "uppercase" | "lowercase";
export type FontStyle = "normal" | "italic" | "oblique";
export type TextDecorationValue = "underline" | "overline" | "line-through";
export type TextDecoration =
  | "normal"
  | TextDecorationValue
  | `${TextDecorationValue} ${TextDecorationValue}`
  | `${TextDecorationValue} ${TextDecorationValue} ${TextDecorationValue}`;

export interface ImageStyles {
  [IMG_REFERENCE_PROPERTY]?: ImageReference;
  [IMG_DISPLAY_PROPERTY]?: ImageDisplayMode;
  imgScale?: ImageDimensionPercentage;
  imgScaleX?: ImageDimensionPercentage;
  imgScaleY?: ImageDimensionPercentage;
  imgWidth?: ImageDimension;
  imgHeight?: ImageDimension;
}

export interface UnderlineStyle {
  underlineColor?: Color;
  underlineThickness?: Thickness;
  underlineOffset?: number;
}
export interface OverlineStyle {
  overlineColor?: Color;
  overlineThickness?: Thickness;
  overlineOffset?: number;
}
export interface LineThroughStyle {
  lineThroughColor?: Color;
  lineThroughThickness?: Thickness;
  lineThroughOffset?: number;
}

export interface TextDecorationStyles
  extends UnderlineStyle,
    OverlineStyle,
    LineThroughStyle {
  textDecoration?: TextDecoration;
}

export interface VerticalAlignStyles {
  valign?: VAlign;
}

export interface VerticalSpacingStyles {
  lineSpacing?: number;
  paragraphSpacing?: number;
  adjustBaseline?: number;
}
export interface FontScaleStyles {
  fontScaleWidth?: number;
  fontScaleHeight?: number;
}
export interface TextTransformStyles {
  textTransform?: TextTransform;
}
export interface TextStyleExtended
  extends Record<string, unknown>,
    Partial<Omit<PIXI.ITextStyle, "align">>,
    ImageStyles,
    TextDecorationStyles,
    VerticalAlignStyles,
    VerticalSpacingStyles,
    FontScaleStyles,
    TextTransformStyles {
  // Overridden properties
  align?: Align;
  fontStyle?: FontStyle;
  fontSize?: FontSize;
}

export interface TextDecorationMetrics {
  color: Color;
  bounds: Bounds;
}

export type TextStyleSet = Record<string, TextStyleExtended>;

///// TAG PARSING

type TagName = string;
type AttributeName = string;
type AttributeValue = string | number;
export type AttributesList = Record<AttributeName, AttributeValue>;
export interface TagWithAttributes {
  tagName: string;
  attributes: AttributesList;
}

export interface TagMatchData extends TagWithAttributes {
  tag: string;
  isOpening: boolean;
  index: number;
}
export type TagStack = TagMatchData[];

///// PARSED TOKENS

export type NewlineToken = "\n";
export type WhitespaceToken = " " | "\t" | NewlineToken;
export type TextToken = string;
export type SpriteToken = PIXI.Sprite;

export interface CompositeToken<T extends Token = Token> {
  children: T[];
}

export type Token = TextToken | CompositeToken | SpriteToken;
export type Tokens = CompositeToken;

export interface TagToken extends CompositeToken<TagToken | TextToken> {
  tag?: TagName;
  attributes?: AttributesList;
}
export type TagTokens = TagToken;

export interface StyledToken
  extends CompositeToken<StyledToken | TextToken | SpriteToken> {
  style: TextStyleExtended;
  tags: string;
}

export type StyledTokens = StyledToken;

export interface IFontMetrics {
  ascent: number;
  descent: number;
  fontSize: number;
}

export interface FinalToken {
  content: TextToken | SpriteToken;
  bounds: Rectangle;
  fontProperties: IFontMetrics;
  style: TextStyleExtended;
  tags: string;
  textDecorations?: TextDecorationMetrics[];
}

export const createEmptyFinalToken = (): FinalToken => ({
  content: "",
  bounds: new PIXI.Rectangle(),
  fontProperties: { ascent: 0, descent: 0, fontSize: 0 },
  style: {},
  tags: "",
  textDecorations: [],
});

export type WordToken = FinalToken[];
export type LineToken = WordToken[];
export type ParagraphToken = LineToken[];

export interface SpriteFinalToken extends FinalToken {
  content: SpriteToken;
}
export interface TextFinalToken extends FinalToken {
  content: TextToken;
}

export interface WhitespaceFinalToken extends TextFinalToken {
  content: WhitespaceToken;
}
export interface NewlineFinalToken extends TextFinalToken {
  content: NewlineToken;
}

export const isWhitespace = (s: string): s is WhitespaceToken =>
  s !== "" &&
  s.split("").every((char: string): boolean => char.search(/\s/) === 0);
export const isNewline = (s: string): s is NewlineToken =>
  isWhitespace(s) && s === "\n";

export const _isSpriteToken = (t: FinalToken): t is SpriteFinalToken =>
  t.content instanceof PIXI.Sprite;
export const isSpriteToken = flatEvery(_isSpriteToken);

export const _isTextToken = (t: FinalToken): t is TextFinalToken =>
  typeof t.content === "string";
export const isTextToken = flatEvery(_isTextToken);

export const _isWhitespaceToken = (t: FinalToken): t is WhitespaceFinalToken =>
  t !== undefined && _isTextToken(t) && isWhitespace(t.content);
export const isWhitespaceToken = flatEvery(_isWhitespaceToken);

export const _isNewlineToken = (t: FinalToken): t is NewlineFinalToken =>
  t !== undefined && _isTextToken(t) && isNewline(t.content);
export const isNewlineToken = (t?: Nested<FinalToken>): boolean =>
  t === undefined ? false : flatEvery(_isNewlineToken)(t);

export const isNotWhitespaceToken = complement(isWhitespaceToken);

export const isEmptyObject = <T extends unknown>(a: T): boolean =>
  a instanceof Object && Object.keys(a).length === 0;

export const isPixel = (s: string): boolean => s.trim().endsWith("px");

export const isEm = (s: string): boolean => s.trim().endsWith("em");

export const isPercent = (s: string): boolean => s.trim().endsWith("%");

export const pixelToNumber = (s: string): number =>
  Number(s.trim().slice(0, -2));
export const emToNumber = pixelToNumber;

export const percentStringToNumber = (s: string): number =>
  isPercent(s) ? Number(s.trim().slice(0, -1)) / 100 : NaN;

export const measurementValueToComponents = (
  input: MeasurementValue
): MeasurementComponents => {
  if (input === undefined) {
    throw new Error("value is undefined!");
  }

  if (typeof input === "number") {
    return { value: input, unit: DEFAULT_MEASUREMENT_UNIT };
  }
  input = input.trim();

  const pattern = new RegExp(Object.values(MeasurementUnit).join("|") + "$");
  const i = input.search(pattern);
  if (i !== -1) {
    return {
      value: parseFloat(input.slice(0, i)),
      unit: input.slice(i) as MeasurementUnit,
    };
  }

  const isAllDigits = input.search(/^[\d.]+$/) === 0;
  if (isAllDigits) {
    const forcedNumberConversion = parseFloat(input);
    if (isNaN(forcedNumberConversion) === false) {
      return { value: parseFloat(input), unit: DEFAULT_MEASUREMENT_UNIT };
    }
  }

  // TOOD: hook into errorHandler
  logWarning()(
    "invalid-units",
    `${input} is not a valid measurement value. Please use one of the following units: ${Object.keys(
      MeasurementUnit
    ).join(", ")}`
  );

  return { value: NaN, unit: MeasurementUnit.unknown };
};
