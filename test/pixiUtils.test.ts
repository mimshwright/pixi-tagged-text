import * as PIXI from "pixi.js";
import * as pixiUtils from "../src/pixiUtils";

describe("pixiUtils", () => {
  describe("cloneSprite()", () => {
    it("should create a shallow copy of a sprite.", () => {
      const originalSprite = PIXI.Sprite.from("./icon.png");
      const cloneSprite = pixiUtils.cloneSprite(originalSprite);

      expect(cloneSprite).not.toBe(originalSprite);
      expect(cloneSprite.texture).toBe(originalSprite.texture);
    });
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

  describe("getFontPropertiesOfText()", () => {
    const textField = new PIXI.Text("Test");

    it("should throw an error if the Text has not had updateText() called at least once.", () => {
      expect(() => {
        pixiUtils.getFontPropertiesOfText(textField);
      }).toThrow();
    });

    it("should before setting any styles (but after calling updateTexT()) the metrics will be an expected default.", () => {
      // Note: text field must update at least once time after being create before the font change will take place.
      const defaultFontProps = pixiUtils.getFontPropertiesOfText(
        textField,
        true
      );
      expect(defaultFontProps.ascent).toBe(24);
      expect(defaultFontProps.descent).toBe(6);
      expect(defaultFontProps.fontSize).toBe(30);
    });

    it("should provide the correct numbers after changing the style for the text.", () => {
      textField.style = {
        fontSize: 30,
        fontFamily: "Arial",
      };
      const fontProps = pixiUtils.getFontPropertiesOfText(textField, true);
      expect(fontProps.ascent).toBe(27);
      expect(fontProps.descent).toBe(7);
      expect(fontProps.fontSize).toBe(34);
    });

    describe("What if the text you want is exactly what the initial value is?", () => {
      it("should not throw an error if you happen to set your text to the same value as the initial values.", () => {
        const trickyText = new PIXI.Text("Tricky", {
          fontSize: 11,
          fontFamily: "arial",
        });
        expect(() => {
          const initialFontProps = pixiUtils.getFontPropertiesOfText(
            trickyText,
            false
          );
          const actualFontProps = pixiUtils.getFontPropertiesOfText(
            trickyText,
            true
          );
          expect(actualFontProps).toMatchObject(initialFontProps);
        }).not.toThrowError();
      });

      it("...however, it will throw if the fontSize is a string (rather than trying to convert it to pxs) unless you use force.", () => {
        const trickyText = new PIXI.Text("Tricky", {
          fontSize: "0.688em",
          fontFamily: "arial",
        });
        expect(() => {
          pixiUtils.getFontPropertiesOfText(trickyText, false);
        }).toThrowError();

        expect(() => {
          pixiUtils.getFontPropertiesOfText(trickyText, true);
        }).not.toThrowError();
      });
    });
  });

  describe("fontSizeStringToNumber", () => {
    describe("Converts different text based font sizes to a pixel number. everything is based on 16px as the base.", () => {
      it("Converts rems and ems to px", () => {
        expect(pixiUtils.fontSizeStringToNumber("1rem")).toBeCloseTo(16);
        expect(pixiUtils.fontSizeStringToNumber("1em")).toBeCloseTo(16);
        expect(pixiUtils.fontSizeStringToNumber("3em")).toBeCloseTo(48);
      });
      it("Converts % to px", () => {
        expect(pixiUtils.fontSizeStringToNumber("100%")).toBeCloseTo(16);
        expect(pixiUtils.fontSizeStringToNumber("200%")).toBeCloseTo(32);
      });
      it("Converts pt to px", () => {
        expect(pixiUtils.fontSizeStringToNumber("10pt")).toBeCloseTo(13.281472);
        expect(pixiUtils.fontSizeStringToNumber("20pt")).toBeCloseTo(26.562945);
      });
      it("Converts px to px", () => {
        expect(pixiUtils.fontSizeStringToNumber("16.0px")).toBe(16.0);
        expect(pixiUtils.fontSizeStringToNumber("100px")).toBe(100);
      });
    });
  });
});
