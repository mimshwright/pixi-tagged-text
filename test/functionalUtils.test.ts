import { combineRecords } from "../src/functionalUtils";

describe("functional util", () => {
  describe("combineRecords()", () => {
    const a = {
      x: "a",
      y: "a",
    };
    const b = {
      y: "b",
      z: "b",
    };
    const c = combineRecords(a, b);

    it("should combine the two objects together into one object", () => {
      expect(c).toHaveProperty("x", "a");
      expect(c).toHaveProperty("z", "b");
    });

    it("should overwrite properties of the first value with the second value", () => {
      expect(c).toHaveProperty("y", "b");
    });

    it("should remain unchanged if second object is empty", () => {
      const d = combineRecords(a, {});
      expect(d).toHaveProperty("x", "a");
      expect(d).toHaveProperty("y", "a");
    });

    it("should return a new object and not change the values of original inputs.", () => {
      expect(a).not.toHaveProperty("z");
      expect(a).not.toStrictEqual(c);
      expect(b).not.toHaveProperty("x");
      expect(b).not.toStrictEqual(c);
    });
  });
});
