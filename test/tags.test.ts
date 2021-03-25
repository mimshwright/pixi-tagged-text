import * as tags from "../src/tags";
import { LINE_BREAK_TAG_NAME } from "../src/types";

describe("tags module", () => {
  describe("replaceSelfClosingTags()", () => {
    let input, expected, actual;
    it("should replace any tags that close themselves with an empty pair of tags.", () => {
      input = "a <b/> c";
      expected = "a <b></b> c";
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });
    it("should keep attributes.", () => {
      input = `a <b attribute="value"    /> c`;
      expected = `a <b attribute="value"></b> c`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);

      input = `a <b c="d"
      e="f"
      g="hijk1235"
      l="" /> m`;
      expected = `a <b c="d" e="f" g="hijk1235" l=""></b> m`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });

    it("should work when there are multple self-closing tags in the string.", () => {
      input = `<a/> <b attribute="value"/> <c
/>`;
      expected = `<a></a> <b attribute="value"></b> <c></c>`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });

    it("should ignore normal tags", () => {
      input = `a <b>b</b> c`;
      expected = input;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });

    it("should ignore unclosed tags and partial pieces of self closing tags.", () => {
      input = `a <b> c`;
      expected = input;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);

      input = `a /> <b`;
      expected = input;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });
  });

  describe("replaceLineBreaks()", () => {
    it("should replace line breaks in multi-line text with tags.", () => {
      const BR = LINE_BREAK_TAG_NAME;
      const s = tags.replaceLineBreaks(`Multi-\nline\nTEXT!`);
      expect(s).toEqual(`Multi-<${BR}></${BR}>line<${BR}></${BR}>TEXT!`);
    });
  });

  describe("Token()", () => {
    it("should create a new Token (partial)", () => {
      expect(
        tags.Token("Hello", [
          { tagName: "b", attributes: { fontWeight: "700" } },
        ])
      ).toMatchObject({
        text: "Hello",
        tags: [{ tagName: "b", attributes: { fontWeight: "700" } }],
      });
    });
    it("should provide empty string and empty array as default values", () => {
      expect(tags.Token()).toMatchObject({
        text: "",
        tags: [],
      });
    });
  });
});