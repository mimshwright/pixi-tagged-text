import { IMG_SRC_PROPERTY, TaggedTextTokenPartial } from "./../src/types";
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
});
