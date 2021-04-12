import * as PIXI from "pixi.js";
import {
  TagTokens,
  TextStyleSet,
  StyledToken,
  TextStyleExtended,
} from "./../src/types";
import * as style from "../src/style";
import iconSrc from "./icon.base64";

describe("style module", () => {
  const iconImage = new Image();
  iconImage.src = `data:image/png;base64,${iconSrc}`;
  const texture = PIXI.Texture.from(iconImage);
  const icon = PIXI.Sprite.from(texture);

  describe("combineStyles()", () => {
    it("should combine 2 styles into one.", () => {
      expect(
        style.combineStyles(
          { fontWeight: "400", fontSize: 12 },
          { fontSize: 24, fontStyle: "italic" }
        )
      ).toMatchObject({ fontWeight: "400", fontSize: 24, fontStyle: "italic" });
    });
  });
  describe("combineAllStyles()", () => {
    it("should combine several styles into one.", () => {
      expect(
        style.combineAllStyles([
          { fontWeight: "400", fontSize: 12 },
          { fontSize: 24, fontStyle: "italic" },
          { wordWrap: false },
          { fontSize: 80 },
        ])
      ).toMatchObject({
        fontWeight: "400",
        fontSize: 80,
        fontStyle: "italic",
        wordWrap: false,
      });
    });
  });
  describe("injectAttributes()", () => {
    it("should replaces or insert values in a style object with values from tag attributes.", () => {
      expect(
        style.injectAttributes(
          { fontWeight: "700", fill: "#333333" },
          { fontWeight: "400", fontSize: 12 }
        )
      ).toMatchObject({
        fontWeight: 700,
        fontSize: 12,
        fill: "#333333",
      });
    });
  });

  describe("tagWithAttributesToStyle", () => {
    const tag = {
      tagName: "em",
      attributes: {
        fontWeight: "700",
      },
    };
    const styles = {
      em: { fontStyle: "italic" },
    };

    it("should convert a tag with attributes into a style", () => {
      const emStyle = style.tagWithAttributesToStyle(tag, styles);

      expect(emStyle).toMatchObject({
        fontStyle: "italic",
        fontWeight: 700,
      });
    });
  });

  describe("getStyleForTag()", () => {
    const styles = {
      em: { fontStyle: "italic" },
    };
    it("should look up the style you asked for in the style tag list", () => {
      expect(style.getStyleForTag("em", styles)).toMatchObject(styles.em);
    });
    it("should replace any values with ones added through attributes", () => {
      expect(
        style.getStyleForTag("em", styles, { fontStyle: "normal" })
      ).toMatchObject({ fontStyle: "normal" });
    });
  });

  describe("getStyleForTags()", () => {
    it("should combine several styles with attributes to create one style.", () => {
      const styleCache = {};
      const tagStyles = {
        default: {
          stroke: "#FF3399",
          strokeThickness: 2,
        },
        strong: {
          fontWeight: "700",
        },
        em: { fontStyle: "italic" },
        tiny: { fontSize: 1 },
        blue: { fill: "blue", fontWeight: "normal" },
      };
      const emTag = {
        tagName: "em",
        attributes: {
          fontSize: 18,
        },
      };
      const strongTag = { tagName: "strong", attributes: {} };
      const blueTag = { tagName: "blue", attributes: {} };

      expect(
        style.getStyleForTags(
          [emTag, strongTag, blueTag],
          tagStyles,
          styleCache
        )
      ).toMatchObject({
        ...tagStyles.default,
        ...tagStyles.em,
        ...emTag.attributes,
        ...tagStyles.strong,
        ...tagStyles.blue,
      });
    });
  });

  describe("mapTagsToStyles()", () => {
    const def: TextStyleExtended = {
      fontSize: 18,
      fontFamily: "Courier",
      wordWrapWidth: 400,
    };

    it("Should not affect text only tokens", () => {
      expect(
        style.mapTagsToStyles({ children: ["foo\nbar"] }, {})
      ).toMatchObject({
        children: ["foo\nbar"],
      });
    });

    it("Should apply the default styles if there are no other tags.", () => {
      expect(
        style.mapTagsToStyles(
          {
            children: ["Hello"],
          },
          { default: def }
        )
      ).toMatchObject({
        style: def,
        tags: "",
        children: ["Hello"],
      });
    });

    it("Should convert TagTokens into StyledTokens", () => {
      const styles = {
        default: def,
        a: { fontSize: 12 },
      };
      const aPlusDefault = { ...styles.default, ...styles.a };

      expect(
        style.mapTagsToStyles(
          {
            tag: "a",
            children: ["b"],
          },
          styles
        )
      ).toMatchObject({
        style: aPlusDefault,
        tags: "a",
        children: ["b"],
      });

      expect(
        style.mapTagsToStyles(
          {
            children: ["1", { tag: "a", children: ["2"] }, "3"],
          },
          styles
        )
      ).toMatchObject({
        style: def,
        children: ["1", { style: aPlusDefault, children: ["2"] }, "3"],
      });
    });

    it("Should handle attributes", () => {
      const input = {
        children: [
          {
            tag: "b",
            attributes: { fontSize: 123 },
            children: [
              "Bing",
              {
                tag: "i",
                children: ["Bong"],
              },
            ],
          },
        ],
      };
      const styles = {
        b: { fontSize: 24, fontWeight: "700" },
        i: { fontStyle: "italic" },
        default: def,
      };
      const expected = {
        children: [
          {
            tags: "b",
            style: {
              fontFamily: "Courier",
              wordWrapWidth: 400,
              fontSize: 123,
              fontWeight: "700",
            },
            children: [
              "Bing",
              {
                tags: "b,i",
                style: {
                  fontFamily: "Courier",
                  wordWrapWidth: 400,
                  fontStyle: "italic",
                  fontWeight: "700",
                  fontSize: 123,
                },
                children: ["Bong"],
              },
            ],
          },
        ],
      };

      expect(style.mapTagsToStyles(input, styles)).toMatchObject(expected);
    });

    it("Should convert deeply nested Tokens", () => {
      const italic = { fontStyle: "italic" };
      const styles = {
        default: italic,
        a: { fontSize: 12 },
        b: { fontSize: 24 },
        c: { fontSize: 36 },
        d: { fontSize: 48 },
      };

      const deeplyNested: TagTokens = {
        children: [
          {
            tag: "a",
            children: [
              {
                tag: "b",
                children: [
                  {
                    tag: "c",
                    children: [
                      {
                        tag: "d",
                        children: ["e"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(style.mapTagsToStyles(deeplyNested, styles)).toMatchObject({
        style: styles.default,
        children: [
          {
            style: { ...styles.default, ...styles.a },
            tags: "a",
            children: [
              {
                style: { ...styles.default, ...styles.a, ...styles.b },
                tags: "a,b",
                children: [
                  {
                    style: {
                      ...styles.default,
                      ...styles.a,
                      ...styles.b,
                      ...styles.c,
                    },
                    tags: "a,b,c",
                    children: [
                      {
                        tags: "a,b,c,d",
                        style: {
                          ...styles.default,
                          ...styles.a,
                          ...styles.b,
                          ...styles.c,
                          ...styles.d,
                        },
                        children: ["e"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    describe("imgMap", () => {
      const styles = {
        img: { fontSize: 48, imgSrc: "img" },
      };
      const imageMap = { img: icon };

      it("Should attach images to tokens that have image references.", () => {
        const input = {
          children: [
            "foo ",
            {
              tag: "img",
              children: [],
            },
          ],
        };
        const result = {
          children: [
            "foo ",
            {
              style: styles.img,
              tags: "img",
              children: [icon],
            },
          ],
        };

        expect(style.mapTagsToStyles(input, styles, imageMap)).toMatchObject(
          result
        );
      });
      it("Should place text inside an image tag to the right of the image.", () => {
        const input = {
          children: [
            {
              tag: "img",
              children: ["text inside img tag"],
            },
          ],
        };
        const result = {
          children: [
            {
              style: styles.img,
              tags: "img",
              children: [icon, "text inside img tag"],
            },
          ],
        };

        expect(style.mapTagsToStyles(input, styles, imageMap)).toMatchObject(
          result
        );
      });
    });

    describe("Memoized style hash", () => {
      const styles: TextStyleSet = {
        i: { fontStyle: "italic", fontFamily: "Arial" },
        b: { fontWeight: "700", fontFamily: "Times" },
      };
      const input = {
        children: [
          "none ",
          {
            tag: "i",
            children: ["Italic"],
          },
          " ",
          {
            tag: "b",
            children: ["Bold"],
          },
          " ",
          {
            tag: "b",
            children: ["Bold Again"],
          },
          " ",
          {
            tag: "i",
            children: [
              {
                tag: "b",
                children: ["Italic Bold"],
              },
            ],
          },
          " ",
          {
            tag: "b",
            children: [
              {
                tag: "i",
                children: ["Bold Italic"],
              },
            ],
          },
          " ",
          {
            tag: "b",
            children: [
              {
                tag: "i",
                children: ["Bold Italic Again"],
              },
            ],
          },
        ],
      };

      const expected = {
        children: [
          "none ",

          {
            style: styles.i,
            tags: "i",
            children: ["Italic"],
          },
          " ",
          {
            style: styles.b,
            tags: "b",
            children: ["Bold"],
          },
          " ",
          {
            style: styles.b,
            tags: "b",
            children: ["Bold Again"],
          },
          " ",
          {
            style: styles.i,
            tags: "i",
            children: [
              {
                style: { ...styles.i, ...styles.b },
                tags: "i,b",
                children: ["Italic Bold"],
              },
            ],
          },
          " ",
          {
            style: styles.b,
            tags: "b",
            children: [
              {
                style: { ...styles.b, ...styles.i },
                tags: "b,i",
                children: ["Bold Italic"],
              },
            ],
          },
          " ",
          {
            style: styles.b,
            tags: "b",
            children: [
              {
                style: { ...styles.b, ...styles.i },
                tags: "b,i",
                children: ["Bold Italic Again"],
              },
            ],
          },
        ],
      };

      const result = style.mapTagsToStyles(input, styles);

      const bold = result.children[3] as StyledToken;
      const boldAgain = result.children[5] as StyledToken;
      const italicBold = (result.children[7] as StyledToken)
        .children[0] as StyledToken;
      const boldItalic = (result.children[9] as StyledToken)
        .children[0] as StyledToken;
      const boldItalicAgain = (result.children[11] as StyledToken)
        .children[0] as StyledToken;

      it("Verifying that the indexes are as expected", () => {
        expect(bold.children[0]).toBe("Bold");
        expect(boldAgain.children[0]).toBe("Bold Again");
        expect(italicBold.children[0]).toBe("Italic Bold");
        expect(boldItalic.children[0]).toBe("Bold Italic");
        expect(boldItalicAgain.children[0]).toBe("Bold Italic Again");
      });

      it("Verifying the entire tree", () => {
        expect(result).toMatchObject(expected);
      });
      it("Should reuse styles with identical tags", () => {
        expect(bold.style).toBe(boldAgain.style);
        expect(boldItalic.style).toBe(boldItalicAgain.style);
      });
      it("Should NOT treat nested tags the same if they're in a different order.", () => {
        expect(italicBold.style).not.toBe(boldItalic.style);
        expect(italicBold.tags).not.toBe(boldItalic.tags);
        expect(italicBold.tags).toBe("i,b");
        expect(boldItalic.tags).toBe("b,i");
        expect(italicBold.style.fontFamily).toBe("Times");
        expect(boldItalic.style.fontFamily).toBe("Arial");
      });
    });
  });
});
