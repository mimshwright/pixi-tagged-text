import * as PIXI from "pixi.js";

// TODO: implement splitStyle: characters
export type SplitStyle = "words" | "characters";
export type SpriteMap = Record<string, PIXI.Sprite>;
export interface RichTextOptions {
  debug?: boolean;
  splitStyle?: SplitStyle;
  spriteMap?: SpriteMap;
}

export type Align = "left" | "right" | "center" | "justify";
export type Color = string | number;
export type Fill = Color | string[] | number[] | CanvasGradient | CanvasPattern;
export interface TextStyle
  extends Record<string, unknown>,
    Partial<PIXI.TextStyle> {
  align?: Align;
}

// todo: add text-transform: uppercase
export type TagStyle = "bbcode" | "xml";
export type VAlign = "top" | "middle" | "bottom" | "baseline" | number;
export type ImageDisplay = "icon" | "block" | "inline";
export interface TextStyleExtended extends TextStyle {
  lineSpacing?: number;
  valign?: VAlign;
}

export type TextStyleSet = Record<string, TextStyleExtended>;

export type AttributesList = Record<string, unknown>;
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

export interface Point {
  x: number;
  y: number;
}
export type Measurement = PIXI.Rectangle;
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
