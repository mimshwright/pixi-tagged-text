import * as textUtils from "../src/textUtils";

describe("textUtils module", () => {
  describe("splitIntoLines()", () => {
    it("should be a function", () => {
      expect(textUtils.splitIntoLines).toBeInstanceOf(Function);
    });
  });
  describe("tokenize()", () => {
    it("should be a function", () => {
      expect(textUtils.tokenize).toBeInstanceOf(Function);
    });
  });
});
