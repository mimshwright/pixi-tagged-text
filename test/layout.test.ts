// Note: some font pixel values are different when rendered in a browser (or Electron) vs using jsdom test environment.
// In order to allow testing in multiple environments for IDE integration, I've made some of these value checks into ranges of 1 px instead.
import {
  createEmptyFinalToken,
  FinalToken,
  ParagraphToken,
  StyledToken,
  StyledTokens,
  TextStyleSet,
} from "./../src/types";
import { splitText } from "./../src/layout";
import * as PIXI from "pixi.js";
import * as layout from "../src/layout";
import { mapTagsToStyles } from "../src/style";
import { parseTagsNew } from "../src/tags";
import { SplitStyle } from "../src/types";

const R = (...args: number[]) => new PIXI.Rectangle(...args);

describe("layout module", () => {
  const maxLineWidth = 500;

  describe("updateOffsetForNewLine()", () => {
    const offset = new PIXI.Point(35, 100);
    const result = layout.updateOffsetForNewLine(offset, 50, 20);
    it("should update the properties of the offset. x would always be zero in this case.", () => {
      expect(result).toHaveProperty("x", 0);
      expect(result).toHaveProperty("y", 170);
    });
    it("should return a copy of the input, not the original input.", () => {
      expect(offset).not.toStrictEqual(result);
    });
  });

  describe("concatBounds()", () => {
    it("Should combine two bounds into one.", () => {
      const bounds = { x: 10, y: 10, width: 20, height: 20 };
      const newBounds = { x: 0, y: 5, width: 15, height: 30 };
      expect(layout.concatBounds(bounds, newBounds)).toMatchObject({
        x: 0,
        y: 5,
        width: 30,
        height: 30,
      });
    });
  });

  describe("getBoundsNested()", () => {
    const testToken = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => ({
      ...createEmptyFinalToken(),
      ...{ bounds: { x, y, width, height } },
    });

    it("Should return the bounding box of a nested group of tokens.", () => {
      let word0 = [testToken(0, 0, 30, 15)];
      let word1 = [testToken(30, 0, 30, 15)];
      let word2 = [
        testToken(40, 0, 10, 15),
        testToken(50, 0, 10, 15),
        testToken(60, 0, 10, 15),
      ];

      expect(layout.getBoundsNested([word0, word1, word2])).toMatchObject({
        x: 0,
        y: 0,
        width: 70,
        height: 15,
      });

      word0 = [testToken(30, 40, 50, 10)];
      word1 = [testToken(80, 30, 50, 30)];
      word2 = [testToken(130, 40, 50, 10)];

      expect(layout.getBoundsNested([word0, word1, word2])).toMatchObject({
        x: 30,
        y: 30,
        width: 150,
        height: 30,
      });
    });
  });

  describe("translatePoint()", () => {
    const rect = R(10, 10, 20, 20);
    const offset = new PIXI.Point(15, -5);
    const result = layout.translatePoint(offset)(rect);
    it("should move a point-like object by an amount.", () => {
      expect(result).toMatchObject({
        x: 25,
        y: 5,
      });
    });
    it("should create a new object rather than editing the original.", () => {
      expect(result).not.toBe(rect);
      expect(rect).toHaveProperty("x", 10);
    });
  });

  describe("translateLine()", () => {
    const line = [R(1, 1, 10, 10), R(2, 2, 10, 10), R(3, 3, 10, 10)];
    const offset = new PIXI.Point(10, 20);
    const result = layout.translateLine(offset)(line);

    it("should offset several points (all the Measurements in a line)", () => {
      expect(result).toMatchObject([
        { x: 11, y: 21, width: 10, height: 10 },
        { x: 12, y: 22, width: 10, height: 10 },
        { x: 13, y: 23, width: 10, height: 10 },
      ]);
    });
    it("should create a new object rather than editing the original.", () => {
      expect(result[0]).not.toBe(line[0]);
    });
  });

  describe("lineWidth()", () => {
    it("should get the total width of the words in a line of measurements.", () => {
      const line = [
        R(0, 30, 100, 20),
        R(100, 30, 100, 20),
        R(200, 30, 100, 20),
      ];
      expect(layout.lineWidth(line)).toBe(300);
    });
    it("should assume that the lines are sorted already left to right.", () => {
      const line = [
        R(0, 30, 100, 20),
        R(200, 30, 100, 20),
        R(100, 30, 100, 20),
      ];
      expect(layout.lineWidth(line)).toBe(200);
    });
    it("should account for positioning of first and last elements.", () => {
      const line = [R(50, 30, 100, 20), R(150, 30, 100, 20)];
      expect(layout.lineWidth(line)).toBe(200);
    });
  });

  describe("alignLeft()", () => {
    it("should align a single line of text to the left.", () => {
      const line = [R(0, 0, 100, 20), R(100, 0, 150, 20), R(250, 0, 100, 20)];
      const expected = [{ x: 0 }, { x: 100 }, { x: 250 }];
      const result = layout.alignLeft(line);
      expect(result).toMatchObject(expected);
    });
    it("should not matter if the original items are out of place nor if the y value isn't the same for all items.", () => {
      const line = [
        R(5000, 0, 120, 20),
        R(-800, 0, 150, 20),
        R(125, 999, 100, 20),
      ];
      const expected = [{ x: 0 }, { x: 120 }, { x: 270, y: 999 }];
      const result = layout.alignLeft(line);
      expect(result).toMatchObject(expected);
    });
  });

  describe("alignRight()", () => {
    it("should align a single line of text to the right.", () => {
      const line = [R(0, 0, 100, 20), R(100, 0, 150, 20), R(250, 0, 100, 20)];
      const expected = [{ x: 150 }, { x: 250 }, { x: 400 }];
      const result = layout.alignRight(maxLineWidth)(line);
      expect(result).toMatchObject(expected);
    });
  });
  describe("alignCenter()", () => {
    it("should align a single line of text to the right.", () => {
      const line = [R(0, 0, 100, 20), R(100, 0, 150, 20), R(250, 0, 100, 20)];

      const expected = [{ x: 75 }, { x: 175 }, { x: 325 }];
      const result = layout.alignCenter(maxLineWidth)(line);
      expect(result).toMatchObject(expected);
    });
  });

  describe("alignJustify()", () => {
    const line = [
      R(0, 30, 100, 20),
      R(100, 30, 75, 20),
      R(175, 30, 25, 20),
      R(200, 30, 100, 20),
      R(300, 30, 30, 20),
    ];

    const spaceSize = (500 - (100 + 75 + 25 + 100 + 30)) / 4;
    const result = layout.alignJustify(maxLineWidth)(line);

    it("should position the words in a line so that they fill the maximum possible space available. It should assume that the array is sorted left to right and that the words all fit inside the space.", () => {
      expect(result).toMatchObject([
        { x: 0 },
        { x: 100 + spaceSize },
        { x: 100 + spaceSize + 75 + spaceSize },
        { x: 100 + spaceSize + 75 + spaceSize + 25 + spaceSize },
        {
          x:
            100 + spaceSize + 75 + spaceSize + 25 + spaceSize + 100 + spaceSize,
        },
      ]);
    });

    it("Should ignore elements that have width of zero.", () => {
      const zeroWidth = R(350, 30, 0, 20);
      expect(
        layout.alignJustify(maxLineWidth)([...line, zeroWidth])
      ).toMatchObject([...result, zeroWidth]);
    });
    it("should create a new object rather than editing the original.", () => {
      expect(result[0]).not.toBe(line[0]);
      expect(line[2]).toHaveProperty("x", 175);
    });

    it("should return an empty object if given an empty object.", () => {
      expect(layout.alignJustify(maxLineWidth)([])).toEqual([]);
    });
    it("should return the first object positioned left if there is only one element.", () => {
      expect(layout.alignJustify(maxLineWidth)([line[4]])).toMatchObject([
        {
          x: 0,
          y: 30,
        },
      ]);
    });
  });

  describe("splitAroundWhitespace()", () => {
    it("Should split at every whitespace but not delete the whitespace, keept it.", () => {
      expect(layout.splitAroundWhitespace("a b c")).toMatchObject([
        "a",
        " ",
        "b",
        " ",
        "c",
      ]);
      expect(layout.splitAroundWhitespace("a\nb")).toMatchObject([
        "a",
        "\n",
        "b",
      ]);
      expect(layout.splitAroundWhitespace("a\tb")).toMatchObject([
        "a",
        "\t",
        "b",
      ]);
      expect(layout.splitAroundWhitespace("a \n b")).toMatchObject([
        "a",
        " ",
        "\n",
        " ",
        "b",
      ]);
      expect(layout.splitAroundWhitespace("a   b")).toMatchObject([
        "a",
        " ",
        " ",
        " ",
        "b",
      ]);
    });
  });

  describe("splitText()", () => {
    const helloWorld = "Hello, world!";
    it("Should split words into segments. If you choose words, it will split on whitespace.", () => {
      expect(layout.splitText(helloWorld, "words")).toMatchObject([
        "Hello,",
        " ",
        "world!",
      ]);
    });
    it("Should split on character if specified", () => {
      expect(layout.splitText(helloWorld, "characters")).toMatchObject([
        "H",
        "e",
        "l",
        "l",
        "o",
        ",",
        " ",
        "w",
        "o",
        "r",
        "l",
        "d",
        "!",
      ]);
    });

    it("Should treat every whitespace as a separate piece.", () => {
      expect(layout.splitText("Hello,   world!", "words")).toMatchObject([
        "Hello,",
        " ",
        " ",
        " ",
        "world!",
      ]);
    });
    it("Should throw if the method is unknown.", () => {
      expect(() => {
        splitText("abc", "bogus" as SplitStyle);
      }).toThrow();
    });
  });

  describe("calculateFinalTokens()", () => {
    it("Should throw if the styledToken has no style", () => {
      expect(() => {
        const fakeStyled = {
          children: ["No styles?"],
          tags: "",
        } as StyledToken;
        layout.calculateFinalTokens(fakeStyled);
      }).toThrow();
    });

    describe("wordWrap and wordWrapWidth properties", () => {
      describe("Should respect the wordWrap property", () => {
        const lorem =
          "Labore dolores possimus aut assumenda sequi quaerat. Ipsa numquam maiores voluptatem autem. Incidunt qui perferendis nesciunt et magni. Omnis quo excepturi.";
        const longLine = 1000;

        it("When wordWrap is true, use the wordWrapWidth to determine the maximum width of a line.", () => {
          const wrap: StyledTokens = {
            children: [lorem],
            tags: "",
            style: { wordWrap: true, wordWrapWidth: 300, fontSize: 16 },
          };
          const wrapTokens = layout.calculateFinalTokens(wrap);

          expect(wrapTokens.length).toBeGreaterThan(1);

          const wrapTokenBounds = layout.getBoundsNested(wrapTokens);
          expect(wrapTokenBounds.width).toBeGreaterThan(200);
          expect(wrapTokenBounds.width).toBeLessThanOrEqual(300);
        });

        it("When wordWrap is true, text can sometimes be larger than wordWrapWidth if a single word is very long.", () => {
          const longWordsSmall: StyledTokens = {
            children: ["abba bbabbabab abababbaba a"],
            tags: "",
            style: { wordWrap: true, wordWrapWidth: 300, fontSize: 32 },
          };
          const longWordsTokensSmall =
            layout.calculateFinalTokens(longWordsSmall);

          const longWordsLarge: StyledTokens = {
            children: ["abba bbabbabab abababbaba a"],
            tags: "",
            style: { wordWrap: true, wordWrapWidth: 300, fontSize: 64 },
          };
          const longWordsTokensLarge =
            layout.calculateFinalTokens(longWordsLarge);

          expect(longWordsTokensSmall.length).toBe(2);
          expect(longWordsTokensLarge.length).toBe(3);

          expect(
            layout.getBoundsNested(longWordsTokensSmall).width
          ).toBeLessThanOrEqual(300);
          expect(
            layout.getBoundsNested(longWordsTokensLarge).width
          ).toBeGreaterThan(300);
        });

        it("When wordWrap is true but wordWrapWidth is undefined, 0, negative, or NaN, it is unbounded.", () => {
          const style = {
            wordWrap: true,
            wordWrapWidth: undefined,
            fontSize: 100,
          };
          const negStyle = { ...style, wordWrapWidth: -1 };
          const nanStyle = { ...style, wordWrapWidth: NaN };
          const zeroStyle = { ...style, wordWrapWidth: 0 };

          const base: StyledTokens = {
            children: [lorem],
            tags: "",
            style,
          };

          const undefinedTokens = layout.calculateFinalTokens(base);
          const negativeTokens = layout.calculateFinalTokens({
            ...base,
            ...{ style: negStyle },
          });
          const nanTokens = layout.calculateFinalTokens({
            ...base,
            ...{ style: nanStyle },
          });
          const zeroTokens = layout.calculateFinalTokens({
            ...base,
            ...{ style: zeroStyle },
          });

          expect(undefinedTokens).toHaveLength(1);
          expect(negativeTokens).toHaveLength(1);
          expect(nanTokens).toHaveLength(1);
          expect(zeroTokens).toHaveLength(1);

          expect(layout.getBoundsNested(undefinedTokens).width).toBeGreaterThan(
            longLine
          );
          expect(layout.getBoundsNested(negativeTokens).width).toBeGreaterThan(
            longLine
          );
          expect(layout.getBoundsNested(nanTokens).width).toBeGreaterThan(
            longLine
          );
          expect(layout.getBoundsNested(zeroTokens).width).toBeGreaterThan(
            longLine
          );
        });

        it("When wordWrap is false, text can continue to grow horizontally indefinitely", () => {
          const noWrap: StyledTokens = {
            children: [lorem],
            tags: "",
            style: { wordWrap: false, fontSize: 100 },
          };
          const noWrapTokens = layout.calculateFinalTokens(noWrap);

          // only one line because no wrapping
          expect(noWrapTokens).toHaveLength(1);
          const noWrapTokenBounds = layout.getBoundsNested(noWrapTokens);
          expect(noWrapTokenBounds.width).toBeGreaterThanOrEqual(longLine);
        });
      });
    });

    describe("Stroked text", () => {
      const line: StyledTokens = {
        children: [
          "A ",
          {
            children: ["B C"],
            style: { fontSize: 20, strokeThickness: 40 },
            tags: "stroke",
          },
        ],
        style: { fontSize: 20 },
        tags: "",
      };
      const tokens = layout.calculateFinalTokens(line);

      const [[[normal], , [stroked], , [alsoStroked]]] = tokens;

      it("Shouldn't affect non-strked text. ", () => {
        expect(normal.content).toBe("A");
        expect(normal.style.strokeThickness ?? 0).toBe(0);
        // Why greater than and less than? see line 1 of this file.
        expect(normal.fontProperties.ascent).toBeGreaterThanOrEqual(18);
        expect(normal.fontProperties.ascent).toBeLessThanOrEqual(19);
        expect(normal.fontProperties.descent).toBe(5);
        expect(normal.fontProperties.fontSize).toBeGreaterThanOrEqual(23);
        expect(normal.fontProperties.fontSize).toBeLessThanOrEqual(24);
        expect(normal.bounds.height).toBe(normal.fontProperties.fontSize);
      });

      it("Should take the stroke into account when determining the size and the fontProperties (for baseline).", () => {
        expect(stroked.content).toBe("B");
        expect(stroked.style.strokeThickness).toBe(40);
        // Why greater than and less than? see line 1 of this file.
        expect(stroked.fontProperties.ascent).toBeGreaterThanOrEqual(38);
        expect(stroked.fontProperties.ascent).toBeLessThanOrEqual(39);
        expect(stroked.fontProperties.descent).toBe(25);
        expect(stroked.fontProperties.fontSize).toBeGreaterThanOrEqual(63);
        expect(stroked.fontProperties.fontSize).toBeLessThanOrEqual(64);
        expect(stroked.bounds.height).toBe(stroked.fontProperties.fontSize);
      });

      it("Should not affect any other stroked text. Sometimes this happens when fontProperties are shared. ", () => {
        expect(alsoStroked.content).toBe("C");
        expect(alsoStroked.style.strokeThickness).toBe(40);
        // Why greater than and less than? see line 1 of this file.
        expect(alsoStroked.fontProperties.ascent).toBeGreaterThanOrEqual(38);
        expect(alsoStroked.fontProperties.ascent).toBeLessThanOrEqual(39);
        expect(alsoStroked.fontProperties.descent).toBe(25);
        expect(alsoStroked.fontProperties.fontSize).toBeGreaterThanOrEqual(63);
        expect(alsoStroked.fontProperties.fontSize).toBeLessThanOrEqual(64);
        expect(alsoStroked.bounds.height).toBe(
          alsoStroked.fontProperties.fontSize
        );
      });
    });

    describe("Text with textTransform style", () => {
      const ttStyle = { textTransform: "uppercase" };
      const styledToken = {
        children: ["www", { children: ["www"], tags: "upper", style: ttStyle }],
        tags: "",
        style: {},
      } as StyledToken;
      const tokens = layout.calculateFinalTokens(styledToken);
      const [[[lc, uc]]] = tokens;

      it("Should calculate sizes of text that has textTransform style correctly without actually changing the content for them.", () => {
        expect(uc.bounds.width).toBeGreaterThan(lc.bounds.width);
        expect(uc.content).toBe(lc.content);
      });
    });

    describe("splitStyle", () => {
      const lws = {
        children: ["Lines, words, & segments!"],
        tags: "",
        style: {},
      };
      const result = layout.calculateFinalTokens(lws);
      it("Should split on whitespace by default", () => {
        expect(result).toHaveLength(1);
        // line 0
        // ["Lines,", " ", "words,", " ", "&", " ", "segmemnts!" ]
        expect(result[0]).toHaveLength(7);
        // word 0
        expect(result[0][0]).toHaveLength(1);
        // word 0 section 0
        expect(result[0][0][0]).toHaveProperty("content", "Lines,");
        // word 1 section 0
        expect(result[0][1][0]).toHaveProperty("content", " ");
        expect(result[0]).toMatchObject([
          [{ content: "Lines," }],
          [{ content: " " }],
          [{ content: "words," }],
          [{ content: " " }],
          [{ content: "&" }],
          [{ content: " " }],
          [{ content: "segments!" }],
        ]);
      });
      it("Should split on character if specified", () => {
        const helloWorld = { children: ["Hello, world!"], tags: "", style: {} };
        expect(
          layout.calculateFinalTokens(helloWorld, "characters")
        ).toMatchObject([
          [
            [
              { content: "H" },
              { content: "e" },
              { content: "l" },
              { content: "l" },
              { content: "o" },
              { content: "," },
            ],
            [{ content: " " }],
            [
              { content: "w" },
              { content: "o" },
              { content: "r" },
              { content: "l" },
              { content: "d" },
              { content: "!" },
            ],
          ],
        ]);
      });
    });

    describe("collapseWhitespacesOnEndOfLines()", () => {
      const fontProperties = { ascent: 10, descent: 2, fontSize: 12 };
      it("Should collapse the width of any whitespace characters that appear at end of lines. (but not in middle)", () => {
        const example: Partial<FinalToken>[][][] = [
          [
            [{ content: "a", fontProperties, bounds: R(0, 0, 10, 10) }],
            [{ content: " ", fontProperties, bounds: R(10, 0, 10, 10) }],
            [{ content: "b", fontProperties, bounds: R(20, 0, 10, 10) }],
            [{ content: " ", fontProperties, bounds: R(30, 0, 10, 10) }],
            [{ content: " ", fontProperties, bounds: R(40, 0, 10, 10) }],
          ],
        ];
        const result = layout.collapseWhitespacesOnEndOfLines(
          example as ParagraphToken
        );
        expect(result).toMatchObject([
          [
            [{ content: "a", bounds: R(0, 0, 10, 10) }],
            [{ content: " ", bounds: R(10, 0, 10, 10) }],
            [{ content: "b", bounds: R(20, 0, 10, 10) }],
            [{ content: " ", bounds: R(30, 0, 0, 10) }],
            [{ content: " ", bounds: R(40, 0, 0, 10) }],
          ],
        ]);
      });
      it("Should collapse width and height of newlines.", () => {
        const example: Partial<FinalToken>[][][] = [
          [
            [{ content: "a", fontProperties, bounds: R(0, 0, 10, 10) }],
            [{ content: "\n", fontProperties, bounds: R(10, 0, 10, 20) }],
          ],
          [
            [{ content: "b", fontProperties, bounds: R(0, 10, 10, 10) }],
            [{ content: " ", fontProperties, bounds: R(10, 10, 10, 10) }],
            [{ content: "\n", fontProperties, bounds: R(20, 10, 10, 20) }],
          ],
          [[{ content: "c", fontProperties, bounds: R(0, 0, 20, 10) }]],
        ];
        const result = layout.collapseWhitespacesOnEndOfLines(
          example as ParagraphToken
        );
        expect(result).toMatchObject([
          [
            [{ content: "a", bounds: R(0, 0, 10, 10) }],
            [{ content: "\n", bounds: R(10, 0, 0, 12) }],
          ],
          [
            [{ content: "b", bounds: R(0, 10, 10, 10) }],
            [{ content: " ", bounds: R(10, 10, 0, 10) }],
            [{ content: "\n", bounds: R(20, 10, 0, 12) }],
          ],
          [[{ content: "c", bounds: R(0, 0, 20, 10) }]],
        ]);
      });
    });

    describe("end to end conversion", () => {
      const textToTags = parseTagsNew;
      const tagsToStyles = mapTagsToStyles;
      const stylesToLayout = layout.calculateFinalTokens;

      const text =
        "<b>Hello, <i>World!</i></b>\nHow are you? I'm <b>S</b>U<b>P</b>E<b>R</b>!";
      const styles: TextStyleSet = {
        default: {
          fontFamily: "arial",
        },
        b: { fontWeight: "700" },
        i: { fontStyle: "italic" },
      };
      const tagTokens = textToTags(text, Object.keys(styles));
      const styleTokens = tagsToStyles(tagTokens, styles);
      const finalTokens = stylesToLayout(styleTokens);

      const [line0, line1] = finalTokens;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [hello, s0, world, n0] = line0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [how, s1, are, s2, you, s3, im, s4, superWord] = line1;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [s, u, p, e, r, bang] = superWord;

      it("Should have default styles for styleTokens", () => {
        expect(styleTokens.style).toMatchObject(styles.default);
      });

      it("Most words should have length 0 but Should treat SuPeR! as one word", () => {
        expect(hello).toHaveLength(1);
        expect(s0).toHaveLength(1);
        expect(n0).toHaveLength(1);

        expect(superWord).toHaveLength(6);
        expect(s).toHaveProperty("tags", "b");
        expect(u).toHaveProperty("tags", "");
      });

      it("Should give similar size properties to text with the same styles and same text.", () => {
        const [space1] = s1;
        const [space2] = s2;
        expect(space1.style).toBe(space2.style);
        expect(space1.content).toBe(space2.content);
        expect(space1.tags).toBe(space2.tags);
        expect(space1.bounds.width).toBe(space2.bounds.width);
        expect(space1.bounds.height).toBe(space2.bounds.height);
        expect(space1.fontProperties).toMatchObject(space2.fontProperties);
      });

      it("Should fully convert text to final tokens.", () => {
        const d = styles.default;
        const b = { ...styles.default, ...styles.b };
        const bi = { ...styles.default, ...styles.b, ...styles.i };

        expect(finalTokens).toMatchObject(
          // all lines
          [
            // line 0
            [
              // word 0
              [
                // segment 0
                {
                  content: "Hello,",
                  style: b,
                  tags: "b",
                },
              ],
              // word 1
              [
                {
                  content: " ",
                  style: b,
                  tags: "b",
                },
              ],
              // word 2
              [
                {
                  content: "World!",
                  style: bi,
                  tags: "b,i",
                },
              ],
              // word 3
              [
                {
                  content: "\n",
                  style: d,
                  tags: "",
                },
              ],
            ],
            // line 1
            [
              [
                {
                  content: "How",
                  style: d,
                },
              ],
              [
                {
                  content: " ",
                  style: d,
                },
              ],
              [
                {
                  content: "are",
                  style: d,
                },
              ],
              [
                {
                  content: " ",
                  style: d,
                },
              ],
              [
                {
                  content: "you?",
                  style: d,
                },
              ],
              [
                {
                  content: " ",
                  style: d,
                },
              ],
              [
                {
                  content: "I'm",
                  style: d,
                },
              ],
              [
                {
                  content: " ",
                  style: d,
                },
              ],
              // word 8 has multiple segments
              [
                // segment 0
                {
                  content: "S",
                  style: b,
                  tags: "b",
                },
                {
                  content: "U",
                  style: d,
                  tags: "",
                },
                {
                  content: "P",
                  style: b,
                },
                {
                  content: "E",
                  style: d,
                },
                {
                  content: "R",
                  style: b,
                },
                {
                  content: "!",
                  style: d,
                },
              ],
            ],
          ]
        );
      });
      it("Should unset styles when there are no styles", () => {
        expect(how[0].style).not.toHaveProperty("fontWeight");
      });
    });
  });

  describe("verticalAlignInLines()", () => {
    const fontProperties = { ascent: 20, descent: 10, fontSize: 30 };
    const lines = [
      // Line 0
      [
        // Word 0
        [
          // Segment 0
          {
            ...createEmptyFinalToken(),
            fontProperties,
            bounds: R(0, 0, 100, 20),
          },
        ],
        // Word 1
        [
          // Segment 0
          {
            ...createEmptyFinalToken(),
            fontProperties,
            bounds: R(100, 0, 100, 40),
          },
        ],
      ],
      // Line 1
      [
        // Word 0
        [
          // Segment 0
          {
            ...createEmptyFinalToken(),
            fontProperties,
            bounds: R(0, 40, 100, 30),
          },
        ],
        // Word 1
        [
          // Segment 0
          {
            ...createEmptyFinalToken(),
            fontProperties,
            bounds: R(100, 40, 100, 20),
          },
        ],
        // Word 2
        [
          // Segment 0
          {
            ...createEmptyFinalToken(),
            fontProperties,
            bounds: R(200, 40, 100, 10),
          },
        ],
      ],
      // Line 2
      [
        // Word 0
        [
          // Segment 0
          {
            ...createEmptyFinalToken(),
            fontProperties,
            bounds: R(0, 70, 100, 20),
          },
        ],
      ],
    ];

    const top = layout.verticalAlignInLines(lines, 0, "top");
    const lineSpacing = layout.verticalAlignInLines(lines, 100, "top");
    const bottom = layout.verticalAlignInLines(lines, 0, "bottom");
    const middle = layout.verticalAlignInLines(lines, 0, "middle");
    it("should position text vertically in a line so that it fits correctly.", () => {
      expect(top).toMatchObject([
        [[{ bounds: { y: 0 } }], [{ bounds: { y: 0 } }]],
        [
          [{ bounds: { y: 40 } }],
          [{ bounds: { y: 40 } }],
          [{ bounds: { y: 40 } }],
        ],
        [[{ bounds: { y: 70 } }]],
      ]);
      expect(lineSpacing).toMatchObject([
        [[{ bounds: { y: 0 } }], [{ bounds: { y: 0 } }]],
        [
          [{ bounds: { y: 140 } }],
          [{ bounds: { y: 140 } }],
          [{ bounds: { y: 140 } }],
        ],
        [[{ bounds: { y: 270 } }]],
      ]);
      expect(bottom).toMatchObject([
        [[{ bounds: { y: 20 } }], [{ bounds: { y: 0 } }]],
        [
          [{ bounds: { y: 40 } }],
          [{ bounds: { y: 50 } }],
          [{ bounds: { y: 60 } }],
        ],
        [[{ bounds: { y: 70 } }]],
      ]);
      expect(middle).toMatchObject([
        [[{ bounds: { y: 10 } }], [{ bounds: { y: 0 } }]],
        [
          [{ bounds: { y: 40 } }],
          [{ bounds: { y: 45 } }],
          [{ bounds: { y: 50 } }],
        ],
        [[{ bounds: { y: 70 } }]],
      ]);
    });
    it("should create a new object rather than editing the original.", () => {
      expect(top[0]).not.toBe(lines[0]);
      expect(top[0][0]).not.toBe(lines[0][0]);
      expect(middle[0]).not.toBe(lines[0]);
      expect(middle[0][0]).not.toBe(lines[0][0]);
      expect(bottom[0]).not.toBe(lines[0]);
      expect(bottom[0][0]).not.toBe(lines[0][0]);
    });
  });
});
