import {
  IMG_SRC_PROPERTY,
  TaggedTextTokenPartial,
  StyledTokens,
  TagTokens,
  TextStyleSet,
  StyledToken,
} from "./../src/types";
import * as style from "../src/style";

describe("style module", () => {
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
      const tagStyles = {
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
        style.getStyleForTags([emTag, strongTag, blueTag], tagStyles)
      ).toMatchObject({
        ...tagStyles.em,
        ...emTag.attributes,
        ...tagStyles.strong,
        ...tagStyles.blue,
      });
    });
  });
  describe("isTokenImage", () => {
    it("should return true if a token contains src field.", () => {
      const plainToken: TaggedTextTokenPartial = {
        text: "Hello",
        tags: [{ tagName: "b", attributes: {} }],
      };
      const imgToken: TaggedTextTokenPartial = {
        text: "",
        tags: [{ tagName: "img", attributes: { [IMG_SRC_PROPERTY]: "icon" } }],
      };
      const imgTokenWithoutAttributes: TaggedTextTokenPartial = {
        text: "",
        tags: [{ tagName: "img", attributes: {} }],
        style: { [IMG_SRC_PROPERTY]: "icon" },
      };
      const srcOnlyToken: TaggedTextTokenPartial = {
        text: "",
        tags: [{ tagName: "span", attributes: { [IMG_SRC_PROPERTY]: "icon" } }],
      };
      const trickyToken: TaggedTextTokenPartial = {
        text: "",
        tags: [{ tagName: "picture", attributes: { link: "icon" } }],
      };

      expect(style.isTokenImage(plainToken)).toBeFalsy();
      expect(style.isTokenImage(imgToken)).toBeTruthy();
      expect(style.isTokenImage(imgTokenWithoutAttributes)).toBeTruthy();
      expect(style.isTokenImage(srcOnlyToken)).toBeTruthy();
      expect(style.isTokenImage(trickyToken)).toBeFalsy();
    });
  });

  describe("mapTagsToStyles()", () => {
    it("Should not affect text only", () => {
      expect(
        style.mapTagsToStyles({ children: ["foo\nbar"] }, {})
      ).toMatchObject({
        children: ["foo\nbar"],
      });
    });

    it("Should convert TagTokens into StyledTokens", () => {
      const styles = {
        a: { fontSize: 12 },
      };

      expect(
        style.mapTagsToStyles(
          {
            tag: "a",
            children: ["b"],
          },
          styles
        )
      ).toMatchObject({
        style: styles.a,
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
        children: ["1", { style: styles.a, children: ["2"] }, "3"],
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
      };
      const expected = {
        children: [
          {
            tags: "b",
            style: {
              fontSize: 123,
              fontWeight: "700",
            },
            children: [
              "Bing",
              {
                tags: "b,i",
                style: {
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
      const styles = {
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
      const expected: StyledTokens = {
        children: [
          {
            style: styles.a,
            tags: "a",
            children: [
              {
                style: { ...styles.a, ...styles.b },
                tags: "a,b",
                children: [
                  {
                    style: { ...styles.a, ...styles.b, ...styles.c },
                    tags: "a,b,c",
                    children: [
                      {
                        tags: "a,b,c,d",
                        style: {
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
      };
      expect(style.mapTagsToStyles(deeplyNested, styles)).toMatchObject(
        expected
      );
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
