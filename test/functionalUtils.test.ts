import { flatReduce, nestedMap } from "./../src/functionalUtils";
import { isWhitespace, Nested } from "./../src/types";
import {
  last,
  combineRecords,
  complement,
  pluck,
  isDefined,
  assoc,
  flatEvery,
} from "../src/functionalUtils";
import * as PIXI from "pixi.js";

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
      const rect = new PIXI.Rectangle(10, 10, 20, 20);
      const rectWithArea = assoc("area")(400)(
        (rect as unknown) as Record<string, unknown>
      );
      expect(rect.right).toBe(30);
      expect(rect.clone).toBeInstanceOf(Function);
      expect(rect).not.toBe(rectWithArea);
      expect(rect.x).toBe(rectWithArea.x);
      expect(rectWithArea.right).toBeUndefined();
      expect(rectWithArea.clone).toBeUndefined();
      expect(rectWithArea.area).toBe(400);
    });
  });

  describe("flatReduce()", () => {
    it("Should run reduce on a flatted nested array.", () => {
      const nested: Nested<number> = [
        1,
        2,
        [3, 4, [5], 6, [7, 8, 9, [10]]],
        11,
      ];
      const isEven = (n: number) => n % 2 === 0;
      const concatIfEven = (a: number[], n: number) =>
        isEven(n) ? a.concat(n) : a;
      const flatConcatIfEvent = flatReduce(concatIfEven, []);

      expect(flatConcatIfEvent(nested)).toMatchObject([2, 4, 6, 8, 10]);
      expect(flatConcatIfEvent(6)).toMatchObject([6]);
    });
  });

  describe("flatEvery()", () => {
    const whitespace = " ";
    const whitespaceFlat = [" ", "\n", " "];
    const whitespaceNested = [" ", [["\n", "\n"], " "]];
    const notWhitespace = "D";
    const notWhitespaceFlat = [" ", "D"];
    const notWhitespaceNested = [" ", ["D"]];

    const isWhitespaceFlat = flatEvery(isWhitespace);

    it("Should work on single items outside of lists.", () => {
      expect(isWhitespaceFlat(whitespace)).toBeTruthy();
      expect(isWhitespaceFlat(whitespace)).toBe(isWhitespace(whitespace));
      expect(isWhitespaceFlat(notWhitespace)).toBeFalsy();
    });
    it("Should work on flat arrays.", () => {
      expect(isWhitespaceFlat(whitespaceFlat)).toBeTruthy();
      expect(isWhitespaceFlat(whitespaceFlat)).toBe(
        whitespaceFlat.every(isWhitespace)
      );
      expect(isWhitespaceFlat(notWhitespaceFlat)).toBeFalsy();
    });
    it("Should work on nested arrays.", () => {
      expect(isWhitespaceFlat(whitespaceNested)).toBeTruthy();
      expect(isWhitespaceFlat(notWhitespaceNested)).toBeFalsy();
    });
  });

  describe("nestedMap()", () => {
    const toUpper = (s: string): string => s.toUpperCase();
    it("Should map over values in an array.", () => {
      const input = ["a", "b", "c"];
      expect(nestedMap(toUpper)(input)).toMatchObject(input.map(toUpper));
    });
    it("If it encounters additional mappable items, it should map over those items too. It should keep the original structure.", () => {
      const input = ["a", ["b", ["c"], "d"], "e"];
      expect(nestedMap(toUpper)(input)).toMatchObject([
        "A",
        ["B", ["C"], "D"],
        "E",
      ]);
    });
    it("Because it works on nests, single items will also be processed.", () => {
      const input = "a";
      expect(nestedMap(toUpper)(input)).toBe("A");
    });
  });
});
