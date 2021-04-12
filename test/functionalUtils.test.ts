import {
  last,
  combineRecords,
  complement,
  pluck,
  isDefined,
  assoc,
} from "../src/functionalUtils";

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

  describe("isDefined()", () => {
    it("Should return true if defined and otherwise false.", () => {
      expect(isDefined("a")).toBeTruthy();
      expect(isDefined("")).toBeTruthy();
      expect(isDefined(null)).toBeTruthy();
      expect(isDefined(undefined)).toBeFalsy();
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

  describe("complement()", () => {
    it("Should take a predicate and return a predicate that produces the opposite answer as the input.", () => {
      const isFoo = (s: string): boolean => s === "foo";
      const isNotFoo = complement(isFoo);

      expect(isFoo("foo")).toBeTruthy();
      expect(isFoo("bar")).toBeFalsy();
      expect(isNotFoo("foo")).toBeFalsy();
      expect(isNotFoo("bar")).toBeTruthy();
    });
  });

  describe("pluck()", () => {
    it("Should take a list of objects and return a list of the values of a given property. {string: T} Obj => string -> Obj[] -> T[]", () => {
      const objects = [
        { text: "hello", style: {} },
        { text: "world!", style: {} },
      ];
      expect(pluck("text")(objects)).toMatchObject(["hello", "world!"]);
    });
  });

  describe("assoc()", () => {
    it("Should set a property on a shallow clone of an object.", () => {
      const arr = ["hello", "world"];
      const arrayWithTitle = assoc("title")("greeting")(arr);
      expect(arr.length).toBe(2);
      expect(arr.push).toBeInstanceOf(Function);
      expect(arr).not.toBe(arrayWithTitle);
      expect(arr[0]).toBe(arrayWithTitle[0]);
      expect(arrayWithTitle.length).toBeUndefined();
      expect(arrayWithTitle.push).toBeUndefined();
      expect(arrayWithTitle.title).toBe("greeting");
    });
  });
});
