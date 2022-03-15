import * as PIXI from "pixi.js";
import {
  TagTokens,
  TextStyleSet,
  StyledToken,
  TextStyleExtended,
  FontStyle,
  TextDecoration,
} from "./../src/types";
import * as style from "../src/style";
import iconSrc from "./icon.base64";

describe("style module", () => {
  const iconImage = new Image();
  iconImage.src = `data:image/png;base64,${iconSrc}`;
  const texture = PIXI.Texture.from(iconImage);
  const icon = PIXI.Sprite.from(texture);

  describe("default styles", () => {
    it("should have a public copy of the default text styles", () => {
      expect(style.DEFAULT_STYLE).toBeDefined();
      expect(style.DEFAULT_STYLE).toHaveProperty("fill", 0x000000);
      expect(style.DEFAULT_STYLE).toHaveProperty("fontSize", 26);
    });
  });

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
    const styles: TextStyleSet = {
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
    const styles: TextStyleSet = {
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
      const tagStyles: TextStyleSet = {
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

  describe("interpretFontSize()", () => {
    it("Should consider the parent font size to get the current font size (if it's a percentage)", () => {
      expect(style.interpretFontSize("20px", "200%")).toBe("40px");
      expect(style.interpretFontSize("1em", "150%")).toBe("1.5em");
    });
    it("Should return the same value if it's not a percentage", () => {
      expect(style.interpretFontSize("12px", "2em")).toBe("2em");
      expect(style.interpretFontSize("20px", "30px")).toBe("30px");
    });
    it("Should add px as a unit if there was no unit on the base value unless the new value has no unit", () => {
      expect(style.interpretFontSize(12, "100%")).toBe("12px");
      expect(style.interpretFontSize("12", "100%")).toBe("12px");
      expect(style.interpretFontSize(12, 50)).toBe(50);
    });
  });

  describe("mapTagsToStyles()", () => {
    const defaultStyle: TextStyleExtended = {
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
          { default: defaultStyle }
        )
      ).toMatchObject({
        style: defaultStyle,
        tags: "",
        children: ["Hello"],
      });
    });

    it("Should convert TagTokens into StyledTokens", () => {
      const styles = {
        default: defaultStyle,
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
        style: defaultStyle,
        tags: "",
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
      const styles: TextStyleSet = {
        b: { fontSize: 24, fontWeight: "700" },
        i: { fontStyle: "italic" as FontStyle },
        default: defaultStyle,
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
      const italic = { fontStyle: "italic" as FontStyle };
      const styles: TextStyleSet = {
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

    describe("It should be responsible for percentage based font size styles.", () => {
      it("Should use 26px as the basis for percentage fontSizes if there are no parent fontSizes.", () => {
        const styles: TextStyleSet = {
          default: {},
          a: { fontSize: "200%" }, // 200% of 26 = 52
        };
        const tagTokens: TagTokens = {
          children: [
            {
              tag: "a",
              children: ["b"],
            },
          ],
        };

        const styledTokens = style.mapTagsToStyles(tagTokens, styles);

        const a = styledTokens.children[0] as StyledToken;
        expect(styledTokens.style).toMatchObject(styles.default);
        expect(a.style).toMatchObject({
          ...styles.default,
          ...styles.a,
          fontSize: "52px",
        });
      });
      it("The percentage should be multiplied by the parent font size.", () => {
        const styles: TextStyleSet = {
          default: { fontSize: 10 },
          a: { fontSize: "200%" }, // 200% of 10 = 20
          b: { fontSize: "75%" }, // 75% of 20 = 15
          c: { fontSize: "10em" }, // reset base size to 10em
          d: { fontSize: "10%" }, // 10% of 10em = 1em
        };

        const tagTokens: TagTokens = {
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

        const styledTokens = style.mapTagsToStyles(tagTokens, styles);

        const a = styledTokens.children[0] as StyledToken;
        const b = a.children[0] as StyledToken;
        const c = b.children[0] as StyledToken;
        const d = c.children[0] as StyledToken;

        expect(styledTokens.style).toMatchObject(styles.default);
        expect(a.style).toMatchObject({
          ...styles.default,
          ...styles.a,
          fontSize: "20px",
        });
        expect(b.style).toMatchObject({
          ...styles.default,
          ...styles.a,
          ...styles.b,
          fontSize: "15px",
        });
        expect(c.style).toMatchObject({
          ...styles.default,
          ...styles.a,
          ...styles.b,
          ...styles.c,
          fontSize: "10em",
        });
        expect(d.style).toMatchObject({
          ...styles.default,
          ...styles.a,
          ...styles.b,
          ...styles.c,
          ...styles.d,
          fontSize: "1em",
        });
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

  describe("convertDecorationToLineProps()", () => {
    it(`Should not alter "textDecoration: 'normal'".`, () => {
      const normal: TextStyleExtended = {
        textDecoration: "normal",
        fill: "#999999",
        fontSize: "12px",
      };
      const newStyle = style.convertDecorationToLineProps(normal);

      expect(newStyle).toMatchObject(normal);
    });

    it(`Should convert "textDecoration: 'underline'" into underline style properties.`, () => {
      const underline: TextStyleExtended = {
        textDecoration: "underline",
        fill: "#0000FF",
        fontSize: "20px",
      };
      const newStyle = style.convertDecorationToLineProps(underline);

      expect(newStyle).toMatchObject({
        fill: "#0000FF",
        fontSize: "20px",
        textDecoration: "underline",
        underlineColor: "#0000FF",
        underlineThickness: 1,
        underlineOffset: 0,
      });
    });

    it(`Should convert "textDecoration: 'overline'" into overline style properties.`, () => {
      const overline: TextStyleExtended = {
        textDecoration: "overline",
        fill: "#000000",
      };
      const newStyle = style.convertDecorationToLineProps(overline);

      expect(newStyle).toMatchObject({
        fill: "#000000",
        textDecoration: "overline",
        overlineColor: "#000000",
        overlineThickness: 1,
        overlineOffset: 0,
      });
    });

    it(`Should convert "textDecoration: 'line-through'" into lineThrough style properties.`, () => {
      const lineThrough: TextStyleExtended = {
        textDecoration: "line-through",
        fill: "#FF99FF",
      };
      const newStyle = style.convertDecorationToLineProps(lineThrough);

      expect(newStyle).toMatchObject({
        textDecoration: "line-through",
        lineThroughColor: "#FF99FF",
        lineThroughThickness: 1,
        lineThroughOffset: 0,
      });
    });

    it(`Should convert "textDecoration" with multiple styles into multiple properties.`, () => {
      const underOver: TextStyleExtended = {
        textDecoration: "underline overline",
        fill: "red",
      };
      const multi: TextStyleExtended = {
        textDecoration: "underline overline line-through",
        fill: "green",
      };
      expect(style.convertDecorationToLineProps(underOver)).toMatchObject({
        textDecoration: "underline overline",
        fill: "red",
        underlineColor: "red",
        overlineColor: "red",
        underlineThickness: 1,
        overlineThickness: 1,
        underlineOffset: 0,
        overlineOffset: 0,
      });
      expect(style.convertDecorationToLineProps(multi)).toMatchObject({
        textDecoration: "underline overline line-through",
        fill: "green",
        underlineColor: "green",
        overlineColor: "green",
        lineThroughColor: "green",
        underlineThickness: 1,
        overlineThickness: 1,
        lineThroughThickness: 1,
        underlineOffset: 0,
        overlineOffset: 0,
        lineThroughOffset: 0,
      });
    });

    it(`Should ignore 'normal' if there are multiple values`, () => {
      const normalMulti: TextStyleExtended = {
        textDecoration: "underline normal overline" as TextDecoration,
        fill: "brown",
      };
      expect(style.convertDecorationToLineProps(normalMulti)).toMatchObject({
        textDecoration: "underline normal overline",
        fill: "brown",
        underlineColor: "brown",
        overlineColor: "brown",
        underlineThickness: 1,
        overlineThickness: 1,
        underlineOffset: 0,
        overlineOffset: 0,
      });
    });

    it(`Shouldn't overwrite any properties that are already set explicitly`, () => {
      const colorUnderline: TextStyleExtended = {
        textDecoration: "underline" as TextDecoration,
        fill: "#334433",
        underlineColor: "#339933",
      };
      expect(style.convertDecorationToLineProps(colorUnderline)).toMatchObject({
        textDecoration: "underline",
        fill: "#334433",
        underlineColor: "#339933",
        underlineThickness: 1,
        underlineOffset: 0,
      });
    });

    it(`Should use a default color if there is no 'fill' set on the default style.`, () => {
      const underline: TextStyleExtended = {
        textDecoration: "underline",
        fontSize: "20px",
      };
      const newStyle = style.convertDecorationToLineProps(underline);

      expect(newStyle).toMatchObject({
        textDecoration: "underline",
        underlineColor: 0,
        underlineThickness: 1,
        underlineOffset: 0,
      });
    });

    it(`Should use the decorationColor and decorationThickness instead of fill color and default thickness if it's defined.`, () => {
      const overunder: TextStyleExtended = {
        textDecoration: "overline underline",
        fill: "#FF6600",
        decorationColor: "#669966",
        decorationThickness: 5,
      };

      expect(style.convertDecorationToLineProps(overunder)).toMatchObject({
        fill: "#FF6600",
        textDecoration: "overline underline",
        overlineColor: "#669966",
        overlineThickness: 5,
        overlineOffset: 0,
        underlineColor: "#669966",
        underlineThickness: 5,
        underlineOffset: 0,
      });

      overunder.underlineColor = "#9900FF";
      overunder.underlineThickness = 1;
      overunder.underlineOffset = 10;
      expect(style.convertDecorationToLineProps(overunder)).toMatchObject({
        fill: "#FF6600",
        textDecoration: "overline underline",
        overlineColor: "#669966",
        overlineThickness: 5,
        overlineOffset: 0,
        underlineColor: "#9900FF",
        underlineThickness: 1,
        underlineOffset: 10,
      });
    });
  });

  describe("extractDecorations()", () => {
    describe("it should convert text styles into TextDecorationMetrics", () => {
      const wordBounds = { x: 50, y: 30, width: 100, height: 30 };
      const fontProps = { ascent: 24, descent: 6, fontSize: 30 };
      const color = "#339933";
      const thickness = 2;
      const offset = 1;

      const colorUnderline: TextStyleExtended = {
        fontSize: 12,
        fill: "#334433",
        underlineColor: color,
        underlineThickness: thickness,
        underlineOffset: offset,
      };

      const overline: TextStyleExtended = {
        overlineColor: color,
        overlineThickness: thickness,
        overlineOffset: offset,
      };
      const lineThrough: TextStyleExtended = {
        lineThroughColor: color,
        lineThroughThickness: thickness,
        lineThroughOffset: offset,
      };

      it("Should convert underline styles correctly.", () => {
        const metrics = style.extractDecorations(
          colorUnderline,
          wordBounds,
          fontProps
        );

        expect(metrics).toHaveLength(1);
        expect(metrics[0]).toHaveProperty(
          "color",
          colorUnderline.underlineColor
        );
        expect(metrics[0].bounds).toHaveProperty("height", 2);
        expect(metrics[0].bounds).toHaveProperty("width", wordBounds.width);
        expect(metrics[0].bounds).toHaveProperty("x", 0);
      });
      describe("It should position the line at the correct y position.", () => {
        it("Should position underline below the baseline, halfway down the descender height.", () => {
          const metrics = style.extractDecorations(
            colorUnderline,
            wordBounds,
            fontProps
          );

          expect(metrics[0].bounds).toHaveProperty(
            "y",
            fontProps.ascent + offset + fontProps.descent / 2
          );
        });
        it("Should position overline above the ascent.", () => {
          const metrics = style.extractDecorations(
            overline,
            wordBounds,
            fontProps
          );
          expect(metrics[0].bounds).toHaveProperty("y", 0 + offset);
        });
        it("Should position lineThrough halfway through the xHeight.", () => {
          const metrics = style.extractDecorations(
            lineThrough,
            wordBounds,
            fontProps
          );
          const xHeight = fontProps.ascent - fontProps.descent;
          expect(metrics[0].bounds).toHaveProperty(
            "y",
            fontProps.ascent - xHeight / 2 + offset
          );
        });
      });
      it("Should convert a style without decoration into an empty array.", () => {
        const noDecoration = style.extractDecorations(
          {},
          wordBounds,
          fontProps
        );
        expect(noDecoration).toHaveLength(0);
      });
    });
  });

  describe("convertUnsupportedAlignment()", () => {
    describe("It should convert alignments not supported by PIXI.Text into ones that are supported.", () => {
      it("Should convert justified types to their classic counterparts", () => {
        expect(style.convertUnsupportedAlignment("justify")).toBe("left");
        expect(style.convertUnsupportedAlignment("justify-left")).toBe("left");
        expect(style.convertUnsupportedAlignment("justify-center")).toBe(
          "center"
        );
        expect(style.convertUnsupportedAlignment("justify-right")).toBe(
          "right"
        );
        expect(style.convertUnsupportedAlignment("justify-all")).toBe("left");
      });
      it("Should convert supported types without changing anything.", () => {
        expect(style.convertUnsupportedAlignment("left")).toBe("left");
        expect(style.convertUnsupportedAlignment("center")).toBe("center");
        expect(style.convertUnsupportedAlignment("right")).toBe("right");
      });
      it("Should handle undefined alignment without error", () => {
        expect(style.convertUnsupportedAlignment()).toBeUndefined();
      });
    });
  });
});
