import * as tags from "../src/tags";

describe("tags module", () => {
  describe("replaceLineBreaks()", () => {
    it("should replace line breaks in multi-line text with tags.", () => {
      const BR = tags.LINE_BREAK_TAG_NAME;
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
