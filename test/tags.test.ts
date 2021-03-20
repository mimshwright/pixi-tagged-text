import * as tags from "../src/tags";

describe("tags module", () => {
  describe("replaceLineBreaks()", () => {
    it("should replace line breaks in multi-line text with tags.", () => {
      const BR = tags.LINE_BREAK_TAG_NAME;
      const s = tags.replaceLineBreaks(`Multi-\nline\nTEXT!`);
      expect(s).toEqual(`Multi-<${BR}></${BR}>line<${BR}></${BR}>TEXT!`);
    });
  });
});
