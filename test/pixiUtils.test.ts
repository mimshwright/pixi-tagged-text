import * as pixiUtils from "../src/pixiUtils";

describe("pixiUtils", () => {
  it("should exist", () => {
    expect(pixiUtils).toBeDefined();
  });

  describe("checkPixiVersion()", () => {
    it("should throw if the version doesn't exactly match", () => {
      expect(() => {
        pixiUtils.checkPixiVersion("", 5);
      }).toThrow();
      expect(() => {
        pixiUtils.checkPixiVersion("4.0.0", 5);
      }).toThrow();
      expect(() => {
        pixiUtils.checkPixiVersion("6.0.0", 5);
      }).toThrow();
    });
    it("should return 0 otherwise", () => {
      expect(pixiUtils.checkPixiVersion("5.3.0", 5)).toBe(0);
    });
  });
});
