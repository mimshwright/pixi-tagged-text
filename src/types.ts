import * as PIXI from "pixi.js";

///// GENERAL PURPOSE
export interface Point {
  x: number;
  y: number;
}

export type Measurement = PIXI.Rectangle;

///// OPTIONS

// TODO: implement splitStyle: characters
export type SplitStyle = "words" | "characters";
export type SpriteReference = PIXI.Sprite;
export type ImageMap = Record<string, SpriteReference>;
export interface RichTextOptions {
  debug?: boolean;
  splitStyle?: SplitStyle;
  imgMap?: ImageMap;
  skipUpdates?: boolean;
  skipDraw?: boolean;
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

export type MeasurementLine = Measurement[];
export type MeasurementLines = MeasurementLine[];
export interface TaggedTextTokenPartial {
  text: string;
  tags: TagWithAttributes[];
  sprite?: PIXI.Sprite;
  style?: TextStyleExtended;
  fontProperties?: PIXI.IFontMetrics;
  measurement?: Measurement;
}

// Same as TaggedTextToken but without any optional properties.
export interface TaggedTextToken extends TaggedTextTokenPartial {
  style: TextStyleExtended;
  fontProperties: PIXI.IFontMetrics;
  measurement: Measurement;
}

export type TextToken = string;
export type WhitespaceToken = TextToken;

export interface CompositeToken<T extends Token = Token> {
  children: T[];
  tag?: TagName;
  attributes?: AttributesList;
}

export type Token = TextToken | CompositeToken<Token>;
export type TagToken = CompositeToken<Token>;
export type Letter = TextToken;
export type Word = CompositeToken<TextToken | WhitespaceToken>;
export type Line = CompositeToken<TagToken | Word>;
export type Paragraph = CompositeToken<Line>;

export type Tokens = CompositeToken<Token>;

// const text =
//   '<b>Hello</b>, <b fontSize="32"><i>world</i>!</b>\nHow <b>are you     ?\nI\'m\t</b>good.\n\n👍';

// const tokens: Tokens = {
//   children: [
//     { children: [{ tag: "b", children: ["Hello"] }, ","] },
//     " ",
//     {
//       tag: "b",
//       attributes: { fontSize: 32 },
//       children: [{ tag: "i", children: ["world"] }, "!"],
//     },
//     "\n",
//     "How",
//     " ",
//     {
//       tag: "b",
//       children: ["are", " ", "you", "     ", "?", "\n", "I'm", "\t"],
//     },
//     "good.",
//     "\n",
//     "\n",
//     "👍",
//   ],
// };
