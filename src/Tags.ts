import { TagMatchData, TextStyleSet, AttributesList } from "./types";

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

export const getTagRegex = (
  tagStyles: TextStyleSet,
  captureTagName: boolean,
  captureMatch: boolean
): RegExp => {
  const tagNames = Object.keys(tagStyles).join("|");

  const captureGroup = (a: string) => `(${a})`;
  const noCaptureGroup = (a: string) => `(?:${a})`;

  const OR = "|";
  const WHITESPACE = `\\s`;
  const S = WHITESPACE + "*";
  const SS = WHITESPACE + "+";
  const CHAR = "[A-Za-z0-9_\\-]";
  const QUOTE = noCaptureGroup(`"|'`);
  const NOT_QUOTE = `[^${QUOTE}]`;
  const ATTRIBUTE_NAME = CHAR + "+";
  const ATTRIBUTE_VALUE = NOT_QUOTE + "+";

  let registeredTagNames;
  if (captureTagName) {
    registeredTagNames = captureGroup(tagNames);
  } else {
    registeredTagNames = noCaptureGroup(tagNames);
  }

  const ATTRIBUTES =
    captureGroup(
      noCaptureGroup(
        SS +
          noCaptureGroup(ATTRIBUTE_NAME) +
          `=` +
          QUOTE +
          noCaptureGroup(ATTRIBUTE_VALUE) +
          QUOTE
      ) + "*"
    ) + "+";
  const TAG_OPEN = `<` + registeredTagNames + ATTRIBUTES + S + `>`;
  const TAG_CLOSE = `</${registeredTagNames}${S}>`;

  let pattern = TAG_OPEN + OR + TAG_CLOSE;

  if (captureMatch) {
    pattern = captureGroup(pattern);
  }

  return new RegExp(pattern, "g");
};

export const parseAttributes = (attributesString = ""): AttributesList => {
  if (attributesString === "") {
    return {};
  }

  const attributes = attributesString.trim().split(/\s+/);

  return attributes.reduce((obj: AttributesList, attribute: string) => {
    const attributePair = attribute.split("=");
    const name = attributePair[0];
    const valueStr: string | number | boolean = attributePair[1].substr(
      1,
      attributePair[1].length - 2
    );
    let value: string | number | boolean;

    if (valueStr === "true" || valueStr === "false") {
      value = valueStr === "true" ? true : false;
    } else {
      const valueNumber = parseFloat(valueStr);
      if (isNaN(valueNumber) === false) {
        value = valueNumber;
      } else {
        value = valueStr;
      }
    }

    obj[name] = value;
    return obj;
  }, {});
};

export const matchToMeta = (match: RegExpExecArray): TagMatchData => {
  const {
    0: tag,
    1: openTagName,
    2: attributes,
    3: closeTagName,
    index,
  } = match;
  const tagName = openTagName ?? closeTagName;
  const isOpening = openTagName !== undefined;
  return {
    tag,
    tagName,
    isOpening,
    attributes: parseAttributes(attributes),
    index,
  };
};
