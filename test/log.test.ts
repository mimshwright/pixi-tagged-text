import { AttributesList, TagWithAttributes } from "./../src/types";
import * as log from "../src/log";

describe("logging functions", () => {
  const tagName = `em`;
  const attributes: AttributesList = {
    fontSize: 23,
    fill: "blue",
  };
  const noAttributes = {};

  const tag: TagWithAttributes = { tagName, attributes };
  const tagNoAttributes = { tagName, attributes: noAttributes };

  const tags: TagWithAttributes[] = [tag, tagNoAttributes];

  const attributesString = `fontSize="23" fill="blue"`;
  const noAttributesString = ``;
  const tagString = `<${tagName} ${attributesString}>`;
  const tagNoAttributesString = `<${tagName}>`;
  const tagsString = `${tagString}, ${tagNoAttributesString}`;

  describe("attributesToString()", () => {
    it("Should convert an AttributeList object into an HTML-style attribute list string", () => {
      expect(log.attributesToString(attributes)).toBe(
        `fontSize="23" fill="blue"`
      );
      expect(log.attributesToString(noAttributes)).toBe(noAttributesString);
    });
  });

  describe("tagToString()", () => {
    it("Should convert a TagWithAttributes to an HTML-style tag string", () => {
      expect(log.tagToString(tag)).toBe(tagString);
      expect(log.tagToString(tagNoAttributes)).toBe(tagNoAttributesString);
    });
  });

  describe("tagsToString()", () => {
    it("Should convert a TagWithAttributes list to an HTML-style tag string separated by commas", () => {
      expect(log.tagsToString(tags)).toBe(tagsString);
      expect(log.tagsToString([tag])).toBe(tagString);
    });
  });

  // describe("tokenToString()", () => {
  //   it("Should convert a TaggedTextToken into string format with the text and its stack of tags.", () => {
  //     expect(log.tokenToString).toBeInstanceOf(Function);
  //   });
  // });

  // describe("tokensToString()", () => {
  //   it("Should convert a list of TaggedTextTokens into string format with the text and its stack of tags each on a separate line.", () => {
  //     expect(log.tokensToString).toBeInstanceOf(Function);
  //   });
  //   it("Should strip out line break tags and empty strings.", () => {
  //     expect(log.tokensToString).toBeInstanceOf(Function);
  //   });
  // });
});
