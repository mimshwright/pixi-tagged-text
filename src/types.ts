import * as PIXI from "pixi.js";

export type TagProperties = Record<string, string>;
export interface TagData {
  name: string;
  properties: TagProperties;
}

export interface HitboxData {
  tag: TagData;
  hitbox: PIXI.Rectangle;
}

export type SplitStyle = "words" | "characters";

export interface RichTextOptions {
  debug?: boolean;
  splitStyle?: SplitStyle;
}

export type TagStyle = "bbcode" | "xml";
export type VAlign = "top" | "middle" | "bottom" | "baseline" | number;
export type Align = "left" | "right" | "center" | "justify";
export type Color = string | number;
export type Fill = Color | string[] | number[] | CanvasGradient | CanvasPattern;

// todo: add text-transform: uppercase
export interface TextStyle extends Record<string, unknown> {
  align?: Align;
  breakWords?: boolean;
  dropShadow?: boolean;
  dropShadowAlpha?: number;
  dropShadowAngle?: number;
  dropShadowBlur?: number;
  dropShadowColor?: Color;
  dropShadowDistance?: number;
  fill?: Fill;
  fillGradientType?: number;
  fillGradientStops?: number[];
  fontFamily?: string | string[];
  fontSize?: number | string;
  fontStyle?: string;
  fontVariant?: string;
  fontWeight?: string;
  leading?: number;
  letterSpacing?: number;
  lineHeight?: number;
  lineSpacing?: number;
  lineJoin?: string;
  miterLimit?: number;
  padding?: number;
  stroke?: Color;
  strokeThickness?: number;
  trim?: boolean;
  textBaseline?: string;
  whiteSpace?: string;
  wordWrap?: boolean;
  wordWrapWidth?: number;
}

export interface TextStyleExtended extends TextStyle {
  valign?: VAlign;
  debug?: boolean;
  tagStyle?: TagStyle;
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
  lineSpacing: number;
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

export type ImageMap = Record<string, PIXI.Container>;

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

export type AttributesList = Record<string, string>;
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

export interface TaggedTextToken {
  text: string;
  tags: TagWithAttributes[];
}

export type Measurement = PIXI.Rectangle;
export type MeasurementLine = Measurement[];
export type MeasurementLines = MeasurementLine[];

export interface Point {
  x: number;
  y: number;
}
