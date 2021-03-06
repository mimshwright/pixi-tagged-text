import {
  TagMatchData,
  TextStyleSet,
  AttributesList,
  TagWithAttributes,
  TaggedText,
  TagStack,
  TagParseResults,
} from "./types";

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

// TODO: this can probably be just a static value without all the options and parameters.
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

export const tagMatchDataToTagWithAttributes = (
  tag: TagMatchData
): TagWithAttributes => ({
  tagName: tag.tagName,
  attributes: tag.attributes,
});

export const parseTags = (
  str: string,
  tagStyles: TextStyleSet = {}
): TagParseResults => {
  const re = getTagRegex(tagStyles, true, false);

  const tags: TagMatchData[] = [];
  const matchesRaw = [];
  let match;
  while ((match = re.exec(str))) {
    const meta = matchToMeta(match);
    matchesRaw.push(match);
    tags.push(meta);
  }

  match = null;
  const segments: string[] = [];
  let remaining = str;
  let offset = 0;
  for (match of tags) {
    if (remaining !== undefined) {
      const { tag, index } = match;
      const startOfTag = index - offset;
      const endOfTag = startOfTag + tag.length;
      offset += endOfTag;

      const segment = remaining.substr(0, startOfTag);
      segments.push(segment);

      remaining = remaining.substr(endOfTag);
    }
  }

  // Add the entire text with no tag as a default value in case there are no tags.
  const untaggedOriginalText: TaggedText = { text: str, tags: [] };
  const taggedTextList: TaggedText[] = [untaggedOriginalText];

  // Track which tags are opened and closed and add them to the list.
  const activeTags: TagStack = [];
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const segment = segments[i];
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

    taggedTextList[i] = {
      text: segment,
      tags: activeTags.map(tagMatchDataToTagWithAttributes),
    };
  }
  if (activeTags.length > 0) {
    console.warn(
      `Found ${activeTags.length} unclosed tags in ${this}\n${activeTags
        .map((tag) => tag.tagName)
        .join("-")}`
    );
  }

  // console.log({ matchesRaw });
  // console.log({ segments });
  // console.log({ tags });
  // console.log({ taggedTextList });

  return taggedTextList;
};
