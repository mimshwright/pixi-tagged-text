import {
  TagMatchData,
  TextStyleSet,
  AttributesList,
  TagWithAttributes,
  TaggedText as TaggedTextToken,
  TagStack,
} from "./types";

// TODO: kill this. only used for old component.
export const TagStyle = {
  bbcode: "bbcode",
  xml: "xml",
};

// TODO: kill this. only used for old component.
export const TagBrackets = {
  bbcode: ["[", "]"],
  xml: ["<", ">"],
};

// TODO: kill this. only used for old component.
export const propertyRegex = new RegExp(
  `([A-Za-z0-9_\\-]+)=(?:"((?:[^"]+|\\\\")*)"|'((?:[^']+|\\\\')*)')`,
  "g"
);

// TODO: kill this. only used for old component.
export const bbcodePropertyRegex = new RegExp(
  `[A-Za-z0-9_\\-]+=([A-Za-z0-9_\\-\\#]+)`,
  "g"
);

// TODO: this can probably be just a static value without all the options and parameters.
// TODO: make it a IIFE
// Seems doing one pass will be enough to gather all relevant info.
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

/**
 * Takes a string of attributes and returns an object with key value pairs for each attribute.
 * Converts "true" | "false" into booleans and number-like strings into numbers.
 * @param attributesString  XML style attributes like "src='/image.png' alt='foo'"
 */
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

export const tagMatchDataToTagWithAttributes = (
  tag: TagMatchData
): TagWithAttributes => ({
  tagName: tag.tagName,
  attributes: tag.attributes,
});

export const createTokens = (
  segments: string[],
  tags: TagMatchData[]
): TaggedTextToken[] => {
  // Add the entire text with no tag as a default value in case there are no tags.
  const untaggedOriginalText: TaggedTextToken = { text: segments[0], tags: [] };
  const taggedTextList: TaggedTextToken[] = [untaggedOriginalText];

  // Track which tags are opened and closed and add them to the list.
  const activeTags: TagStack = [];
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const segment = segments[i + 1] ?? "";
    if (tag.isOpening) {
      activeTags.push(tag);
    } else {
      const poppedTag = activeTags.pop();
      if (poppedTag === undefined || poppedTag.tagName !== tag.tagName) {
        throw new Error(
          `Unexpected tag nesting. Found a closing tag "${tag.tag}" that doesn't match the previously open tag "${poppedTag?.tag}"`
        );
      }
    }

    taggedTextList.push({
      text: segment,
      tags: activeTags.map(tagMatchDataToTagWithAttributes),
    });
  }
  if (activeTags.length > 0) {
    console.warn(
      `Found ${activeTags.length} unclosed tags in ${this}\n${activeTags
        .map((tag) => tag.tagName)
        .join("-")}`
    );
  }

  return taggedTextList;
};

/**
 * Converts a string into a list of tokens that match segments of text with styles.
 *
 * @param str Input string with XML-style tags.
 * @param tagStyles Used to only tokenize tags that have styles defined for them.
 */
export const parseTags = (
  str: string,
  tagStyles: TextStyleSet = {}
): TaggedTextToken[] => {
  // TODO: Warn the user if tags were found that are not defined in the tagStyles.
  const re = getTagRegex(tagStyles, true, false);
  const tags: TagMatchData[] = [];
  const matchesRaw: RegExpExecArray[] = [];
  const segments: string[] = [];
  let match;
  let remaining = str;
  let offset = 0;
  while ((match = re.exec(str))) {
    matchesRaw.push(match);

    const tagMeta = matchToMeta(match);
    tags.push(tagMeta);

    if (remaining !== undefined) {
      const { tag, index } = tagMeta;
      const startOfTag = index - offset;
      const endOfTag = startOfTag + tag.length;
      offset += endOfTag;

      const segment = remaining.substr(0, startOfTag);
      segments.push(segment);

      remaining = remaining.substr(endOfTag);
      segments.push(remaining);
    }
  }

  const tokens = createTokens(segments, tags);

  // console.log({ matchesRaw });
  // console.log({ segments });
  // console.log({ tags });
  // console.log({ tokens });

  return tokens;
};

// LOGGING

const attributesToString = (attributes: AttributesList) =>
  Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${value}"`)
    .join(" ");

const tagsToString = (tags: TagWithAttributes[]) =>
  tags
    .map(
      ({ tagName, attributes }) =>
        ` <${tagName}${attributesToString(attributes)}>`
    )
    .join(",");

const tokenToString = ({ tags, text }: TaggedTextToken): string =>
  text
    ? tags
      ? `"${text.replace(/\n/, "\\n")}"   ${tagsToString(tags)}\n`
      : ""
    : "";

/**
 * Converts the tagged text tokens into a string format where each string
 * segment is listed with its stack of tags.
 */
export const tokensToString = (tokens: TaggedTextToken[]): string =>
  tokens.reduce((acc, token) => (acc += tokenToString(token)), "");
