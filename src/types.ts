import * as PIXI from "pixi.js";
import { complement } from "./functionalUtils";

///// GENERAL PURPOSE
export interface Point {
  x: number;
  y: number;
}

export type Bounds = PIXI.Rectangle;

///// OPTIONS

// TODO: implement splitStyle: characters
export type SplitStyle = "words" | "characters";
export type SpriteReference = PIXI.Sprite;
export type ImageMap = Record<string, SpriteReference>;
export interface RichTextOptions {
  debug?: boolean;
  debugConsole?: boolean;
  splitStyle?: SplitStyle;
  imgMap?: ImageMap;
  skipUpdates?: boolean;
  skipDraw?: boolean;
  drawWhitespace?: boolean;
}

///// STYLE PROPERTIES

// PROPERTY NAMES
export const LINE_BREAK_TAG_NAME = "__br__";
export const IMG_SRC_PROPERTY = "imgSrc";
export const IMG_DISPLAY_PROPERTY = "imgDisplay";

// todo: add text-transform: uppercase
export type VAlign = "top" | "middle" | "bottom" | "baseline" | number;
export type Align = "left" | "right" | "center" | "justify";
export type Color = string | number;
export type Fill = Color | string[] | number[] | CanvasGradient | CanvasPattern;
export type ImageDisplayMode = "icon" | "block" | "inline";
export type ImageSource = string;
export type ImageDimensionPercentage = string;
export type ImageDimension = number | string | ImageDimensionPercentage;

export interface TextStyle
  extends Record<string, unknown>,
    Partial<PIXI.TextStyle> {
  align?: Align;
}
export interface TextStyleExtended extends TextStyle {
  lineSpacing?: number;
  valign?: VAlign;

  [IMG_SRC_PROPERTY]?: ImageSource;
  [IMG_DISPLAY_PROPERTY]?: ImageDisplayMode;
  imgScale?: ImageDimensionPercentage;
  imgScaleX?: ImageDimensionPercentage;
  imgScaleY?: ImageDimensionPercentage;
  imgWidth?: ImageDimension;
  imgHeight?: ImageDimension;
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

export type MeasurementLine = Bounds[];
export type MeasurementLines = MeasurementLine[];
export interface TaggedTextTokenPartial {
  text: string;
  tags: TagWithAttributes[];
  sprite?: PIXI.Sprite;
  style?: TextStyleExtended;
  fontProperties?: PIXI.IFontMetrics;
  measurement?: Bounds;
}

// Same as TaggedTextToken but without any optional properties.
export type TaggedTextToken = Required<TaggedTextTokenPartial>;

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

export type StyledTokens = CompositeToken<StyledToken | TextToken>;
export interface FinalToken {
  content: TextToken | SpriteToken;
  bounds: Bounds;
  style: TextStyleExtended;
  tags: string;
  fontProperties: PIXI.IFontMetrics;
}
export interface SpriteFinalToken extends FinalToken {
  content: SpriteToken;
}
export interface TextFinalToken extends FinalToken {
  content: TextToken;
}

export interface WhitespaceFinalToken extends TextFinalToken {
  content: WhitespaceToken;
}

export const isWhitespace = (s: string): s is WhitespaceToken =>
  s !== "" &&
  s.split("").every((char: string): boolean => char.search(/\s/) === 0);

export const isSpriteToken = (t: FinalToken): t is SpriteFinalToken =>
  t.content instanceof PIXI.Sprite;
export const isTextToken = (t: FinalToken): t is TextFinalToken =>
  typeof t.content === "string";
export const isWhitespaceToken = (t: FinalToken): t is WhitespaceFinalToken =>
  isTextToken(t) && isWhitespace(t.content);

export const isNotWhitespaceToken = complement(isWhitespaceToken);

export const isEmptyObject = <T extends unknown>(a: T): boolean =>
  a instanceof Object && Object.keys(a).length === 0;
