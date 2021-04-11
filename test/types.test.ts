import * as PIXI from "pixi.js";
import {
  isEmptyObject,
  isSpriteToken,
  isTextToken,
  isWhitespace,
  isWhitespaceToken,
} from "./../src/types";

describe("Type validation", () => {
  const textToken = {
    content: "Hello",
    bounds: new PIXI.Rectangle(),
    fontProperties: { ascent: 10, descent: 3, fontSize: 13 },
    style: {},
    tags: "img",
  };
  const spriteToken = {
    content: new PIXI.Sprite(),
    bounds: new PIXI.Rectangle(),
    fontProperties: { ascent: 10, descent: 3, fontSize: 13 },
    style: {},
    tags: "img",
  };

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

  describe("isTextToken()", () => {
    it("Should return true if token is a text token.", () => {
      expect(isTextToken(textToken)).toBeTruthy();
    });
    it("Should return false if the token is not a text token.", () => {
      expect(isTextToken(spriteToken)).toBeFalsy();
    });
  });

  describe("isWhitespaceToken()", () => {
    it("Should return true if the token is whitespace.", () => {
      expect(isWhitespaceToken({ ...textToken, content: " " })).toBeTruthy();
      expect(isWhitespaceToken({ ...textToken, content: "   " })).toBeTruthy();
      expect(isWhitespaceToken({ ...textToken, content: "\n" })).toBeTruthy();
      expect(isWhitespaceToken({ ...textToken, content: "\t" })).toBeTruthy();
    });
    it("Should return false if the token is not.", () => {
      expect(isWhitespaceToken(textToken)).toBeFalsy();
      expect(isWhitespaceToken(spriteToken)).toBeFalsy();
    });
    it("Should return false if it's empty.", () => {
      expect(isWhitespaceToken({ ...textToken, content: "" })).toBeFalsy();
    });
  });

  describe("isSpriteToken()", () => {
    it("Should return true if the content is a sprite", () => {
      expect(isSpriteToken(spriteToken)).toBeTruthy();
    });
    it("Should return false if the content is not a sprite", () => {
      expect(isSpriteToken(textToken)).toBeFalsy();
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
});
