import { TextData, TextStyleExtended, TagData } from "./types";
export const TagStyle = {
  bbcode: "bbcode",
  xml: "xml",
};

export const TagBrackets = {
  bbcode: ["[", "]"],
  xml: ["<", ">"],
};

export const propertyRegex = new RegExp(
  `([A-Za-z0-9_\\-]+)=(?:"((?:[^"]+|\\\\")*)"|'((?:[^']+|\\\\')*)')`,
  "g"
);

export const bbcodePropertyRegex = new RegExp(
  `[A-Za-z0-9_\\-]+=([A-Za-z0-9_\\-\\#]+)`,
  "g"
);

export const createTextData = (
  text: string,
  style: TextStyleExtended,
  tag: TagData
): TextData => ({
  text,
  style,
  width: 0,
  height: 0,
  fontProperties: { ascent: 0, descent: 0, fontSize: 0 },
  tag,
});
