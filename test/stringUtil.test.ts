import * as stringUtil from "../src/stringUtil";

describe("srtingUtil", () => {
  describe("capitalize()", () => {
    it("should capitalize the first letter of a string.", () => {
      expect(stringUtil.capitalize("test")).toBe("Test");
    });
  });

  describe("stringIsNumber()", () => {
    const f = stringUtil.stringIsNumber;
    it("Should return true if the string is a number.", () => {
      expect(f("1")).toBeTruthy();
      expect(f("100")).toBeTruthy();
    });
    it("Should return true if the first char is -.", () => {
      expect(f("-1")).toBeTruthy();
      expect(f("-100")).toBeTruthy();
    });
    it("Should return true if there is a single period followed by another number", () => {
      expect(f("1.0")).toBeTruthy();
      expect(f("123.321")).toBeTruthy();
      expect(f("0.5")).toBeTruthy();
      expect(f(".1")).toBeTruthy();
      expect(f("-.1")).toBeTruthy();
      expect(f("-11.11")).toBeTruthy();
    });
    it("Should trim whitespace.", () => {
      expect(f("  1")).toBeTruthy();
      expect(f("100   ")).toBeTruthy();
      expect(f(" 123 ")).toBeTruthy();
      expect(
        f(`
100
`)
      ).toBeTruthy();
      expect(f(" 1 2 3 ")).toBeFalsy();
    });
    it("Should return false if empty.", () => {
      expect(f("")).toBeFalsy();
    });
    it("Should return false if there are any non-numbers.", () => {
      expect(f("123f")).toBeFalsy();
      expect(f("100%")).toBeFalsy();
      expect(f("$100")).toBeFalsy();
    });
    it("Should return false if there is whitespace in the middle.", () => {
      expect(f("1 2")).toBeFalsy();
    });
    it("Should return false if there are multiple periods.", () => {
      expect(f("1.2.3")).toBeFalsy();
    });
    it("Should return false if there are negatives in the middle.", () => {
      expect(f("-1-1")).toBeFalsy();
      expect(f("1-1")).toBeFalsy();
      expect(f("1-")).toBeFalsy();
    });
  });
});
