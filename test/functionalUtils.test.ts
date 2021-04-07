import { isEmptyObject, last, combineRecords } from "../src/functionalUtils";

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

  describe("isEmptyObject()", () => {
    it("Should return true if the input is an empty object, i.e. {}", () => {
      expect(isEmptyObject({})).toBeTruthy();
      expect(isEmptyObject([])).toBeTruthy();
    });
    it("Should return false if the input is not empty or not an object", () => {
      expect(isEmptyObject({ foo: "bar" })).toBeFalsy();
      expect(isEmptyObject("Bar")).toBeFalsy();
      expect(isEmptyObject(5)).toBeFalsy();
      expect(isEmptyObject([1, 2, 3])).toBeFalsy();
      expect(isEmptyObject(null)).toBeFalsy();
      expect(isEmptyObject(undefined)).toBeFalsy();
      expect(isEmptyObject(NaN)).toBeFalsy();
    });
  });

  describe("last()", () => {
    it("Should return the last item in a list.", () => {
      expect(last([1, 2, 3])).toBe(3);
      expect(last([1])).toBe(1);
      expect(last(["a", "b", "c"])).toBe("c");
      expect(
        last(
          last([
            [1, 2],
            [2, 3],
            [3, 4],
          ])
        )
      ).toBe(4);
    });
    it("Should return undefined if the list is empty.", () => {
      expect(last([])).toBeUndefined();
    });
  });
});
