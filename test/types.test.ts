import * as PIXI from "pixi.js";
import {
  isEmptyObject,
  isSpriteToken,
  isTextToken,
  isWhitespace,
  isWhitespaceToken,
  isNewline,
  isNewlineToken,
  TextFinalToken,
  SpriteFinalToken,
  percentStringToNumber,
  isPercent,
} from "./../src/types";

describe("Type validation", () => {
  const textToken = {
    content: "Hello",
    bounds: { ...new PIXI.Rectangle() },
    fontProperties: {
      ascent: 10,
      descent: 3,
      fontSize: 13,
    },
    style: {},
    tags: "img",
    textDecorations: [],
  } as TextFinalToken;
  const spriteToken = {
    content: new PIXI.Sprite(),
    bounds: { ...new PIXI.Rectangle() },
    fontProperties: { ascent: 10, descent: 3, fontSize: 13 },
    style: {},
    tags: "img",
  } as SpriteFinalToken;

  const spaceToken = { ...textToken, content: " " };
  const multispaceToken = { ...textToken, content: " " };
  const tabToken = { ...textToken, content: "\t" };
  const newlineToken = { ...textToken, content: "\n" };
  const emptyToken = { ...textToken, content: "" };

  describe("isWhitespace()", () => {
    it("Should return true if the token is whitespace.", () => {
      expect(isWhitespace(" ")).toBeTruthy();
      expect(isWhitespace("\t")).toBeTruthy();
      expect(isWhitespace("   ")).toBeTruthy();
      expect(isWhitespace("\t  \t")).toBeTruthy();
      expect(isWhitespace("\n")).toBeTruthy();
      expect(isWhitespace("\n  ")).toBeTruthy();
    });
    it("Should return false if the token is not.", () => {
      expect(isWhitespace("F")).toBeFalsy();
      expect(isWhitespace("Hello")).toBeFalsy();
      expect(isWhitespace("   F")).toBeFalsy();
      expect(isWhitespace("\tF\t")).toBeFalsy();
    });
    it("Should return false if it's empty.", () => {
      expect(isWhitespace("")).toBeFalsy();
    });
  });

  describe("isNewline()", () => {
    it("Should return true if the token is a newline.", () => {
      expect(isNewline("\n")).toBeTruthy();
    });
    it("Should return false if the token is not.", () => {
      expect(isNewline("")).toBeFalsy();
      expect(isNewline("F")).toBeFalsy();
      expect(isNewline("   \n")).toBeFalsy();
      expect(isNewline("\n\n")).toBeFalsy();
    });
  });

  describe("isTextToken()", () => {
    it("Should return true if token is a text token.", () => {
      expect(isTextToken(textToken)).toBeTruthy();
    });
    it("Should return false if the token is not a text token.", () => {
      expect(isTextToken(spriteToken)).toBeFalsy();
    });
    it("Should word recursively.", () => {
      expect(isTextToken([textToken, textToken])).toBeTruthy();
      expect(isTextToken([[textToken], textToken])).toBeTruthy();
      expect(isTextToken([textToken, spriteToken])).toBeFalsy();
    });
  });

  describe("isWhitespaceToken()", () => {
    it("Should return true if the token is whitespace.", () => {
      expect(isWhitespaceToken(spaceToken)).toBeTruthy();
      expect(isWhitespaceToken(multispaceToken)).toBeTruthy();
      expect(isWhitespaceToken(tabToken)).toBeTruthy();
      expect(isWhitespaceToken(newlineToken)).toBeTruthy();
    });
    it("Should return false if the token is not.", () => {
      expect(isWhitespaceToken(textToken)).toBeFalsy();
      expect(isWhitespaceToken(spriteToken)).toBeFalsy();
    });
    it("Should return false if it's empty.", () => {
      expect(isWhitespaceToken(emptyToken)).toBeFalsy();
    });
    it("Should word recursively.", () => {
      expect(isWhitespaceToken([spaceToken, newlineToken])).toBeTruthy();
      expect(isWhitespaceToken([spaceToken, textToken])).toBeFalsy();
    });
  });
  describe("isNewlineToken()", () => {
    it("Should return true if the token is a newline.", () => {
      expect(isNewlineToken(newlineToken)).toBeTruthy();
    });
    it("Should return false if the token is not.", () => {
      expect(isNewlineToken(textToken)).toBeFalsy();
      expect(isNewlineToken(spriteToken)).toBeFalsy();
      expect(isNewlineToken(spaceToken)).toBeFalsy();
    });
    it("Should work recursively.", () => {
      expect(
        isNewlineToken([newlineToken, [newlineToken], newlineToken])
      ).toBeTruthy();
      expect(isNewlineToken([newlineToken, [spaceToken]])).toBeFalsy();
    });
  });

  describe("isSpriteToken()", () => {
    it("Should return true if the content is a sprite", () => {
      expect(isSpriteToken(spriteToken)).toBeTruthy();
    });
    it("Should return false if the content is not a sprite", () => {
      expect(isSpriteToken(textToken)).toBeFalsy();
    });
    it("Should work recursively.", () => {
      expect(isSpriteToken([[spriteToken], spriteToken])).toBeTruthy();
      expect(isSpriteToken([spriteToken, textToken])).toBeFalsy();
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

  describe("isPercent()", () => {
    it("Should return true if the input is a percentage.", () => {
      expect(isPercent("50%")).toBeTruthy();
      expect(isPercent("0%")).toBeTruthy();
      expect(isPercent("100%")).toBeTruthy();
    });
    it("Should ignore extra whitespace", () => {
      expect(isPercent(" 50% ")).toBeTruthy();
    });
    it("Should return false if the input is not a percentage.", () => {
      expect(isPercent("50")).toBeFalsy();
      expect(isPercent("0")).toBeFalsy();
      expect(isPercent("100")).toBeFalsy();
      expect(isPercent("50px")).toBeFalsy();
      expect(isPercent("0px")).toBeFalsy();
      expect(isPercent("100px")).toBeFalsy();
      expect(isPercent("50%px")).toBeFalsy();
      expect(isPercent("0%px")).toBeFalsy();
      expect(isPercent("100%px")).toBeFalsy();
    });
  });

  describe("percentStringToNumber()", () => {
    it("Should return the percentage as a number.", () => {
      expect(percentStringToNumber("50%")).toBe(0.5);
      expect(percentStringToNumber("0%")).toBe(0);
      expect(percentStringToNumber("100%")).toBe(1.0);
    });
    it("Should return NaN if the input is not a percentage.", () => {
      expect(percentStringToNumber("50")).toBeNaN();
      expect(percentStringToNumber("0")).toBeNaN();
      expect(percentStringToNumber("100")).toBeNaN();
      expect(percentStringToNumber("50px")).toBeNaN();
      expect(percentStringToNumber("0px")).toBeNaN();
      expect(percentStringToNumber("100px")).toBeNaN();
      expect(percentStringToNumber("50%px")).toBeNaN();
      expect(percentStringToNumber("0%px")).toBeNaN();
      expect(percentStringToNumber("100%px")).toBeNaN();
    });
  });
});
