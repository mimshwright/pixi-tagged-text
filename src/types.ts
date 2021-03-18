import * as PIXI from "pixi.js";

export type TagProperties = Record<string, string>;
// TODO remove
export interface TagData {
  name: string;
  properties: TagProperties;
}

//todo, remove
export interface HitboxData {
  tag: TagData;
  hitbox: PIXI.Rectangle;
}

// TODO: implement splitStyle: characters
export type SplitStyle = "words" | "characters";
export type SpriteMap = Record<string, PIXI.Container>;
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
export interface TextStyleExtended extends TextStyle {
  lineSpacing?: number;
  valign?: VAlign;
  tagStyle?: TagStyle;
  debug?: boolean;
  src?: string;
}

export interface TextStyleExtendedWithDefault extends TextStyleExtended {
  dropShadowAlpha?: number;
  fillGradientStops?: number[];
  leading?: number;
  trim?: boolean;
  whiteSpace?: string;

  align: Align;
  breakWords: boolean;
  dropShadow: boolean;
  dropShadowAngle: number;
  dropShadowBlur: number;
  dropShadowColor: Color;
  dropShadowDistance: number;
  fill: Fill;
  fillGradientType: number;
  fontFamily: string | string[];
  fontSize: number | string;
  fontStyle: string;
  fontVariant: string;
  fontWeight: string;
  letterSpacing: number;
  lineHeight: number;
  lineJoin: string;
  miterLimit: number;
  padding: number;
  stroke: Color;
  strokeThickness: number;
  textBaseline: string;
  wordWrap: boolean;
  wordWrapWidth: number;

  valign: VAlign;
  debug: boolean;
  tagStyle: TagStyle;
}

export type TextStyleSet = Record<string, TextStyleExtended>;

export type TextStyleSetWithDefault = {
  default: TextStyleExtendedWithDefault;
} & TextStyleSet;

export interface FontProperties {
  ascent: number;
  descent: number;
  fontSize: number;
}

export interface TextData {
  text: string;
  style: TextStyleExtended;
  width: number;
  height: number;
  fontProperties: FontProperties;
  tag: TagData;
}

export interface TextDrawingData {
  text: string;
  style: TextStyleExtended;
  x: number;
  y: number;
  width: number;
  ascent: number;
  descent: number;
  tag: TagData;
}

export interface MstDebugOptions {
  spans: {
    enabled?: boolean;
    baseline?: string;
    top?: string;
    bottom?: string;
    bounding?: string;
    text?: boolean;
  };
  objects: {
    enabled?: boolean;
    bounding?: string;
    text?: boolean;
  };
}

export interface MstInteractionEvent extends PIXI.InteractionEvent {
  targetTag: TagData | undefined;
}
export interface TextWithPrivateMembers {
  dirty: boolean;
  _texture: PIXI.Texture;
  _style: PIXI.TextStyle;
  _onTextureUpdate(): void;
  _generateFillStyle(
    style: PIXI.TextStyle,
    lines: string[]
  ): string | number | CanvasGradient;
}

export interface TextLineMeasurements {
  width: number;
  height: number;
  maxLineWidth: number;
  lineWidths: number[];
  lineYMins: number[];
  lineYMaxs: number[];
  totalHeight: number;
  maxStrokeThickness: number;
  dropShadowPadding: number;
  basePositionY: number;
}

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
  sprite?: PIXI.Container;
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
