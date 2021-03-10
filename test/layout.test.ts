import * as layout from "../src/layout";

describe("layout module", () => {
  describe("calculateMeasurements()", () => {
    it("should be a function", () => {
      expect(layout.calculateMeasurements).toBeInstanceOf(Function);
    });
  });
});
