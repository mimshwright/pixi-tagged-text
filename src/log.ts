import {
  AttributesList,
  LINE_BREAK_TAG_NAME,
  TaggedTextTokenPartial,
  TagWithAttributes,
} from "./types";

export const attributesToString = (attributes: AttributesList): string =>
  Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

export const tagToString = ({
  tagName,
  attributes,
}: TagWithAttributes): string => {
  const a = attributesToString(attributes);
  const space = a === "" ? "" : " ";
  return `<${tagName}${space}${a}>`;
};

export const tagsToString = (tags: TagWithAttributes[]): string =>
  tags.map(tagToString).join(", ");

export const tokenToString = ({ tags, text }: TaggedTextTokenPartial): string =>
  tags ? `"${text.replace(/\n/, "\\n")}"  -> ${tagsToString(tags)}` : "";

/**
 * Converts the tagged text tokens into a string format where each string
 * segment is listed with its stack of tags.
 */
export const tokensToString = (tokens: TaggedTextTokenPartial[]): string =>
  tokens
    .filter((t) => t.tags[0]?.tagName === LINE_BREAK_TAG_NAME || t.text !== "")
    .reduce((acc, token) => `${acc}${tokenToString(token)}\n`, "");
