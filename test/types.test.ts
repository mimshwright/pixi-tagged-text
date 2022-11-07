import * as PIXI from "pixi.js";
import {
  isEmptyObject,
  isSpriteToken,
  isTextToken,
  isWhitespace,
  isWhitespaceToken,
  isNewline,
  isNewlineToken,
  TextSegmentToken,
  SpriteSegmentToken,
  percentStringToNumber,
  isPercent,
  measurementValueToComponents,
  isPixel,
  isEm,
  pixelToNumber,
  isImageElement,
  isBaseTexture,
  isTextureSource,
  isSpriteSource,
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
  } as TextSegmentToken;
  const spriteToken = {
    content: new PIXI.Sprite(),
    bounds: { ...new PIXI.Rectangle() },
    fontProperties: { ascent: 10, descent: 3, fontSize: 13 },
    style: {},
    tags: "img",
  } as SpriteSegmentToken;

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
      expect(isNewlineToken(undefined)).toBeFalsy();
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

  describe("sprite sources", () => {
    describe("isImageElement()", () => {
      it("Should return true if the object is an image element.", () => {
        expect(isImageElement(new Image())).toBeTruthy();
      });
    });
    describe("isBaseTexture()", () => {
      it("Should return true if the object is a pixi base texture", () => {
        expect(isBaseTexture(new PIXI.BaseTexture())).toBeTruthy();
      });
    });
    describe("isTextureSource()", () => {
      it("Should return true if the object can be used as the source for a texture.", () => {
        expect(isTextureSource(new Image())).toBeTruthy();
        expect(isTextureSource(new PIXI.BaseTexture())).toBeTruthy();
      });
    });
    describe("isSpriteSource()", () => {
      it("Should return true if the object is any kind of sprite source.", () => {
        expect(isSpriteSource("my url")).toBeTruthy();
        expect(
          isSpriteSource(new PIXI.Texture(new PIXI.BaseTexture()))
        ).toBeTruthy();
        expect(isSpriteSource(document.createElement("canvas"))).toBeTruthy();
        expect(isSpriteSource(document.createElement("video"))).toBeTruthy();
      });
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
  describe("isPixel()", () => {
    it("Should return true if the input is a pixel.", () => {
      expect(isPixel("0px")).toBeTruthy();
      expect(isPixel("50px")).toBeTruthy();
    });
    it("Should ignore extra whitespace", () => {
      expect(isPixel(" 50px ")).toBeTruthy();
    });
    it("Should return false if the input is not a pixel.", () => {
      expect(isPixel("50")).toBeFalsy();
      expect(isPixel("50%")).toBeFalsy();
      expect(isPixel("px100")).toBeFalsy();
      expect(isPixel("100px%")).toBeFalsy();
    });
  });
  describe("isEm()", () => {
    it("Should return true if the input unit is em.", () => {
      expect(isEm("0em")).toBeTruthy();
      expect(isEm("50em")).toBeTruthy();
    });
    it("Should ignore extra whitespace", () => {
      expect(isEm(" 50em ")).toBeTruthy();
    });
    it("Should return false if the input is not ems.", () => {
      expect(isEm("50")).toBeFalsy();
      expect(isEm("50%")).toBeFalsy();
      expect(isEm("em100")).toBeFalsy();
    });
  });

  describe("pixelToNumber()", () => {
    it("Should convert pixel values to numbers", () => {
      expect(pixelToNumber("100px")).toEqual(100);
      expect(pixelToNumber("0px")).toEqual(0);
    });
    it("Should ignore extra whitespace", () => {
      expect(pixelToNumber("  100px  ")).toEqual(100);
    });
    it("Should not do any checking", () => {
      expect(pixelToNumber("100")).toEqual(1);
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

  describe("measurementValueToComponents()", () => {
    it("Should throw when the first argument is undefined.", () => {
      expect(() => {
        measurementValueToComponents(undefined as unknown as number);
      }).toThrow();
    });
    it("Should return the measurement value as a number and a unit.", () => {
      expect(measurementValueToComponents("50px")).toMatchObject({
        value: 50,
        unit: "px",
      });
      expect(measurementValueToComponents("75%")).toMatchObject({
        value: 75,
        unit: "%",
      });
    });
    it("Should default to pixels.", () => {
      expect(measurementValueToComponents(25)).toMatchObject({
        value: 25,
        unit: "px",
      });
      expect(measurementValueToComponents("12.5")).toMatchObject({
        value: 12.5,
        unit: "px",
      });
    });
    it("Should support any value in MeasurementUnit", () => {
      const testUnit = (unit: string): void =>
        expect(measurementValueToComponents(`1${unit}`)).toMatchObject({
          value: 1,
          unit,
        });
      testUnit("px");
      testUnit("em");
      testUnit("rem");
      testUnit("pt");
      testUnit("pc");
      testUnit("in");
      testUnit("cm");
      testUnit("mm");
      testUnit("%");
    });
    it("Should return NaN / unknown if the measurement is invalid.", () => {
      const spyConsole = spyOn(console, "warn");
      expect(measurementValueToComponents("50furlongs")).toEqual({
        value: NaN,
        unit: "unknown",
      });
      expect(spyConsole).toHaveBeenCalled();
    });
  });
});
