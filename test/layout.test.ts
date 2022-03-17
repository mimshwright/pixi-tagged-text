import { cloneSprite } from "./../src/pixiUtils";
import {
  Align,
  createEmptyFinalToken,
  FinalToken,
  ParagraphToken,
  StyledToken,
  StyledTokens,
  SplitStyle,
  TextStyleSet,
  TextStyleExtended,
  LineToken,
} from "./../src/types";
import { splitText } from "./../src/layout";
import * as PIXI from "pixi.js";
import * as layout from "../src/layout";
import * as style from "../src/style";
import * as tags from "../src/tags";
import { icon } from "./support/testIcon";

const R = (...args: number[]) => new PIXI.Rectangle(...args);

const textToTags = tags.parseTagsNew;
const tagsToStyles = style.mapTagsToStyles;
const stylesToLayout = layout.calculateFinalTokens;

const toBeBetween = (actual: number, a: number, b: number) => {
  expect(actual).toBeGreaterThanOrEqual(a);
  expect(actual).toBeLessThanOrEqual(b);
};

describe("layout module", () => {
  const maxLineWidth = 500;

  const noStyle = {} as TextStyleExtended;

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

    describe("whitespace and alignJustify() (Issue #171)", () => {
      it("Should not throw when align is justify and text is only whitespace.", () => {
        expect(() => {
          layout.alignJustify(maxLineWidth)([]);
        }).not.toThrow();

        expect(() => {
          const text = "  ";
          const styles: TextStyleSet = {
            default: {
              align: "justify",
            },
          };
          const tagTokens = textToTags(text, Object.keys(styles));
          const styleTokens = tagsToStyles(tagTokens, styles);
          layout.calculateFinalTokens(styleTokens);
        }).not.toThrow();
      });
    });
  });

  describe("alignLines()", () => {
    it("Should throw when given an invalid alignment type.", () => {
      expect(() => {
        // @ts-ignore-line
        layout.alignLines("backwards", 500, []);
      }).toThrow();
    });

    it("Should allow all valid alignment types.", () => {
      const alignments = [
        "left",
        "center",
        "right",
        "justify",
        "justify-left",
        "justify-right",
        "justify-center",
        "justify-all",
      ];
      alignments.map((a) =>
        // @ts-ignore-line
        expect(() => layout.alignLines(a, 500, [])).not.toThrow()
      );
    });

    const style: TextStyleExtended = {
      fontFamily: "Courier",
      fontSize: 20,
      wordWrapWidth: 400,
    };
    const makeToken = (content: string): FinalToken => ({
      content,
      style,
      bounds: { x: 0, y: 0, width: 100, height: 20 },
      fontProperties: { ascent: 16, descent: 4, fontSize: 20 },
      tags: "",
    });
    const makeSpace = () => ({
      ...makeToken(" "),
      bounds: { x: 0, y: 0, width: 20, height: 20 },
    });
    const makeLine = (contents: string[]) =>
      contents.map((content) =>
        content === " " ? [makeSpace()] : [makeToken(content)]
      );
    const tokens = [
      makeLine(["12345", " ", "12345", " ", "12345"]),
      makeLine(["12345", " ", "12345"]),
    ];

    const leftPos = [
      [0, 100, 120, 220, 240],
      [0, 100, 120],
    ];
    const rightPos = [
      [60, 160, 180, 280, 300],
      [180, 280, 300],
    ];
    const centerPos = [
      [30, 130, 150, 250, 270],
      [90, 190, 210],
    ];
    const justifyPos = [
      [0, 115, 150, 265, 300],
      [0, 190, 300],
    ];
    const justifyLeftPos = [justifyPos[0], leftPos[1]];
    const justifyRightPos = [justifyPos[0], rightPos[1]];
    const justifyCenterPos = [justifyPos[0], centerPos[1]];

    const expectTokens = (tokens: ParagraphToken) => ({
      toMatchPositions: (positions: number[][]): void =>
        tokens.forEach((line, lineIndex) =>
          line.forEach((word, wordIndex) =>
            expect(word[0].bounds.x).toBe(positions[lineIndex][wordIndex])
          )
        ),
    });

    const align = (align: Align) => layout.alignLines(align, 400, tokens);

    it("Should align lines left aligned.", () => {
      expectTokens(align("left")).toMatchPositions(leftPos);
    });

    it("Should align lines right aligned.", () => {
      // calling align("left") is a little hack to reset the token positions.
      // I think it has to do with reusing the tokens or bounds objects during testing.
      align("left");
      expectTokens(align("right")).toMatchPositions(rightPos);
    });

    it("Should align lines center aligned.", () => {
      align("left");
      expectTokens(align("center")).toMatchPositions(centerPos);
    });
    it("Should align lines justify-all aligned.", () => {
      align("left");
      expectTokens(align("justify-all")).toMatchPositions(justifyPos);
    });

    it("Should align lines justify / justify-left.", () => {
      align("left");
      expectTokens(align("justify")).toMatchPositions(justifyLeftPos);
      align("left");
      expectTokens(align("justify-left")).toMatchPositions(justifyLeftPos);
    });

    it("Should align lines justify-right.", () => {
      align("left");
      expectTokens(align("justify-right")).toMatchPositions(justifyRightPos);
    });

    it("Should align lines justify-center.", () => {
      align("left");
      expectTokens(align("justify-center")).toMatchPositions(justifyCenterPos);
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

        it("Should not cut off text at the end of a line. (issue 118)", () => {
          const text = `aa bb aa
aa bb aa`;
          const www = 300;
          const style = {
            fontSize: 64,
            wordWrap: true,
            wordWrapWidth: www,
          };

          const wrappingStyledTokens = {
            children: [text],
            tags: "",
            style: style,
          };

          const tokens = layout.calculateFinalTokens(wrappingStyledTokens);

          wrappingStyledTokens.children = [text + " "];
          const tokensWithExtraSpace =
            layout.calculateFinalTokens(wrappingStyledTokens);

          expect(tokens).toHaveLength(2);
          expect(tokensWithExtraSpace).toHaveLength(2);
          expect(tokens[0]).toHaveLength(6);
          expect(tokensWithExtraSpace[0]).toHaveLength(6);
          expect(tokens[1]).toHaveLength(5);
          expect(tokensWithExtraSpace[1]).toHaveLength(6);
          expect(tokens[1][4][0].bounds.width).toBe(
            tokensWithExtraSpace[1][4][0].bounds.width
          );

          const [, , , , a1, n0, a2] = tokens.flat(2);
          // first line is under bounds width.
          expect(a1.bounds.x + a1.bounds.width).toBeLessThan(www);
          // first line plus the first word of second line is over bounds width.
          expect(
            a1.bounds.x + a1.bounds.width + n0.bounds.width + a2.bounds.width
          ).toBeGreaterThan(www);
        });

        describe("When the line width is about exactly the same as wordWrapWidth the last space appears on the next line. It should not include the final space in a line in the overall layout calculus. It should appear after the last word in the line and have a width of 0. (Issue 100)", () => {
          // This string will wrap right after the comma.
          const text = "XXXX XXXXX, XX XXXX.";
          const style = {
            fontFamily: "arial",
            fontSize: 24,
            align: "left" as Align,
            wordWrap: true,
            wordWrapWidth: 200,
          };
          const spaceWrap = {
            children: [text],
            style,
            tags: "",
          };

          const tokens = layout.calculateFinalTokens(spaceWrap);
          const [line0, line1] = tokens;
          test("First line contains first 2 words and final space before wrap", () => {
            expect(line0).toHaveLength(6);
          });
          test("Second line contains the final word.", () => {
            expect(line1).toHaveLength(1);
          });

          const [
            ,
            ,
            ,
            earlierSpace,
            lastWordFirstLine,
            finalSpace,
            firstWordSecondLine,
          ] = tokens.flat(2);
          test("Check that the line is wrapping at the right place.", () => {
            const lastWordRightEdge =
              lastWordFirstLine.bounds.x + lastWordFirstLine.bounds.width;
            expect(lastWordRightEdge).toBeLessThan(200);
            expect(
              lastWordRightEdge + firstWordSecondLine.bounds.width
            ).toBeGreaterThan(200);
          });
          test("Spaces are defined as expected", () => {
            expect(earlierSpace.content).toBe(" ");
            expect(finalSpace.content).toBe(" ");
          });
          test("Space has width 0", () => {
            expect(earlierSpace.bounds.width).toBeGreaterThan(0);
            expect(finalSpace.bounds.width).toBe(0);
          });
          test("Space is at the end of the first line", () => {
            expect(finalSpace.bounds.y).toBe(0);
          });

          test("Words are defined as expected", () => {
            expect(lastWordFirstLine.content).toBe("XX");
            expect(firstWordSecondLine.content).toBe("XXXX.");
          });
          test("XX is at the start of the second line", () => {
            expect(firstWordSecondLine.bounds.x).toBe(0);
            expect(firstWordSecondLine.bounds.y).toBeGreaterThan(0);
          });
        });

        it("When wordWrap is true, text can sometimes be larger than wordWrapWidth if a single word is very long.", () => {
          const shared = {
            children: ["abba bbabb abababbaba a"],
            tags: "",
            style: { wordWrap: true, wordWrapWidth: 300, fontSize: 32 },
          };
          const longWordsSmall: StyledTokens = shared;
          const longWordsTokensSmall =
            layout.calculateFinalTokens(longWordsSmall);

          const longWordsLarge: StyledTokens = {
            ...shared,
            style: { ...shared.style, fontSize: 64 },
          };
          const longWordsTokensLarge =
            layout.calculateFinalTokens(longWordsLarge);

          expect(longWordsTokensSmall.length).toBe(2);
          expect(longWordsTokensLarge.length).toBe(4);

          const longestWordSmall = longWordsTokensSmall.flat(2)[4];
          const longestWordLarge = longWordsTokensLarge.flat(2)[4];

          expect(longestWordSmall.bounds.width).toBeLessThanOrEqual(300);
          expect(longestWordLarge.bounds.width).toBeGreaterThan(300);
        });

        it("When the first word in the string is very very long, it should not wrap.", () => {
          const text = ["aaaaaaaaaaaaaaaaaaaa bbb ccc"];
          const www = 300;
          const style = { fontSize: 64, wordWrap: true, wordWrapWidth: www };
          const firstWordLong = layout.calculateFinalTokens({
            children: text,
            tags: "",
            style,
          });

          const longWord = firstWordLong.flat(2)[0];
          expect(longWord.bounds.x).toBe(0);
          expect(longWord.bounds.width).toBeGreaterThan(www);

          // expect 2 lines
          expect(firstWordLong.length).toBe(2);
          // expect 1 word and a space in the first line.
          expect(firstWordLong[0]).toHaveLength(2);
          expect(firstWordLong[0][0][0].content).toBe("aaaaaaaaaaaaaaaaaaaa");
          expect(firstWordLong[0][1][0].content).toBe(" ");
        });

        describe("If the last word in the string should make the line wrap, it should wrap. (Issue 100)", () => {
          const www = 300;
          const style = {
            tags: "",
            children: [""],
            style: {
              align: "left" as Align,
              fontSize: 64,
              wordWrap: true,
              wordWrapWidth: www,
            },
          };

          test("If the length of the entire text is less than wordWrapWidth, it should not wrap.", () => {
            style.children = ["aa bb aa"];
            const shouldNotWrap = layout.calculateFinalTokens(style);
            const [, , , space, aa] = shouldNotWrap.flat(2);
            const totalWidth =
              space.bounds.x + space.bounds.width + aa.bounds.width;

            expect(space.content).toBe(" ");
            expect(aa.content).toBe("aa");

            expect(totalWidth).toBeLessThan(www);
            // expect 1 line
            expect(shouldNotWrap).toHaveLength(1);
            // expect 5 words
            expect(shouldNotWrap.flat(2)).toHaveLength(5);
          });

          test("If the last word makes the first line longer than the wordWrapWidth, it should wrap with the last word on a line by itself.", () => {
            style.children = ["aaa bbb aaa"];
            const shouldWrap = layout.calculateFinalTokens(style);

            const [, , , space, aaa] = shouldWrap.flat(2);
            const totalWidth =
              space.bounds.x + space.bounds.width + aaa.bounds.width;

            expect(space.content).toBe(" ");
            expect(aaa.content).toBe("aaa");

            // "aaa" is at the same x position on each line.
            expect(shouldWrap[0][0][0].bounds.x).toBe(
              shouldWrap[1][0][0].bounds.x
            );

            expect(totalWidth).toBeGreaterThan(www);
            // expect 2 lines
            expect(shouldWrap).toHaveLength(2);
            // expect 5 words
            expect(shouldWrap.flat(2)).toHaveLength(5);
          });
          test("If the last word makes line longer than the wordWrapWidth, but not on the first line of text, it should wrap with the last word on a line by itself.", () => {
            style.children = ["aaa bbb aaa bbb aaa"];
            const shouldWrapTwice = layout.calculateFinalTokens(style);

            const [, , , , , , , space, aaa] = shouldWrapTwice.flat(2);
            const totalWidth =
              space.bounds.x + space.bounds.width + aaa.bounds.width;

            expect(space.content).toBe(" ");
            expect(aaa.content).toBe("aaa");

            // "aaa" is at the same x position on each line.
            expect(shouldWrapTwice[0][0][0].bounds.x).toBe(
              shouldWrapTwice[1][0][0].bounds.x
            );
            expect(shouldWrapTwice[1][0][0].bounds.x).toBe(
              shouldWrapTwice[2][0][0].bounds.x
            );

            expect(totalWidth).toBeGreaterThan(www);
            // expect 3 lines
            expect(shouldWrapTwice).toHaveLength(3);
            // expect 9 words
            expect(shouldWrapTwice.flat(2)).toHaveLength(9);
          });
        });

        it("Should align last row correctly when center or right aligned (fix issue where the last line isn't in alignment)", () => {
          const style = {
            children: ["aaaa bbb aaaa bbb aaaa bbb"],
            tags: "",
            style: {
              align: "left" as Align,
              fontSize: 64,
              wordWrap: true,
              wordWrapWidth: 300,
            },
          };
          // aaaa and bbb should be positioned the same for top and bottom line.
          const left = layout.calculateFinalTokens(style);
          style.style.align = "right" as Align;
          const right = layout.calculateFinalTokens(style);
          style.style.align = "center" as Align;
          const center = layout.calculateFinalTokens(style);

          expect(left).toHaveLength(3);
          expect(left[0][2][0].bounds.x).toBe(left[1][2][0].bounds.x);
          expect(left[0][2][0].bounds.x).toBe(left[2][2][0].bounds.x);

          expect(right).toHaveLength(3);
          expect(right[0][2][0].bounds.x).toBe(right[1][2][0].bounds.x);
          expect(right[0][2][0].bounds.x).toBe(right[2][2][0].bounds.x);

          expect(center).toHaveLength(3);
          expect(center[0][2][0].bounds.x).toBe(center[1][2][0].bounds.x);
          expect(center[0][2][0].bounds.x).toBe(center[2][2][0].bounds.x);
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
        toBeBetween(normal.bounds.height, 23, 24);
        toBeBetween(normal.fontProperties.ascent, 18, 19);
        expect(normal.fontProperties.descent).toBe(5);
        toBeBetween(normal.fontProperties.fontSize, 23, 24);
      });

      it("Should take the stroke into account when determining the size and the fontProperties (for baseline).", () => {
        expect(stroked.content).toBe("B");
        expect(stroked.style.strokeThickness).toBe(40);
        toBeBetween(stroked.bounds.height, 63, 64);
        toBeBetween(stroked.fontProperties.ascent, 38, 39);
        expect(stroked.fontProperties.descent).toBe(25);
        toBeBetween(stroked.fontProperties.fontSize, 63, 64);
      });

      it("Should not affect any other stroked text. Sometimes this happens when fontProperties are shared. ", () => {
        expect(alsoStroked.content).toBe("C");
        expect(alsoStroked.style.strokeThickness).toBe(40);
        toBeBetween(alsoStroked.bounds.height, 63, 64);
        toBeBetween(alsoStroked.fontProperties.ascent, 38, 39);
        expect(alsoStroked.fontProperties.descent).toBe(25);
        toBeBetween(alsoStroked.fontProperties.fontSize, 63, 64);
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

    describe("Scaled text", () => {
      const makeExample = (style: TextStyleExtended): StyledTokens => ({
        children: [
          {
            children: ["scaled"],
            tags: "scaled",
            style: { fontSize: 30, ...style } as TextStyleExtended,
          },
          " unscaled",
        ],
        tags: "",
        style: { fontSize: 30 },
      });

      const control = makeExample({});
      const controlTokens = layout.calculateFinalTokens(control).flat(2);
      expect(controlTokens).toHaveLength(3);
      const [scaled, , unscaled] = controlTokens;
      const W = scaled.bounds.width;
      const H = scaled.bounds.height;

      it("Default should be 1x scale for X and Y.", () => {
        toBeBetween(W, 87, 88);
        toBeBetween(H, 34, 35);
        toBeBetween(unscaled.bounds.width, 121, 122);
        toBeBetween(unscaled.bounds.height, 34, 35);

        const def = makeExample({ fontScaleWidth: 1, fontScaleHeight: 1 });
        const scaleSetToDefaultValues = layout
          .calculateFinalTokens(def)
          .flat(2);
        expect(scaleSetToDefaultValues[0]).toMatchObject(scaled);
        expect(scaleSetToDefaultValues[2]).toMatchObject(unscaled);
      });

      it("Should scale the width of text.", () => {
        const wide = makeExample({ fontScaleWidth: 2.0 });
        const wideTokens = layout.calculateFinalTokens(wide).flat(2)[0];

        expect(wideTokens.bounds.width / W).toBeCloseTo(2);

        const condensed = makeExample({ fontScaleWidth: 0.5 });
        const condensedTokens = layout
          .calculateFinalTokens(condensed)
          .flat(2)[0];
        expect(condensedTokens.bounds.width / W).toBeCloseTo(0.5);
      });
      it("Scale the height of text by using fontSize and <100% font scaling.", () => {
        const tall = makeExample({ fontScaleHeight: 2 });
        const tallTokens = layout.calculateFinalTokens(tall).flat(2);
        expect(tallTokens[0].bounds.width / W).toBeCloseTo(1, 1);
        expect(tallTokens[0].bounds.height / H).toBeCloseTo(2, 1);

        const short = makeExample({ fontScaleHeight: 0.5 });
        const shortTokens = layout.calculateFinalTokens(short).flat(2);
        expect(shortTokens[0].bounds.width / W).toBeCloseTo(1, 1);
        expect(shortTokens[0].bounds.height / H).toBeCloseTo(0.5, 1);
      });

      it("Should convert NaN to 0", () => {
        const bogus = makeExample({ fontScaleHeight: NaN });
        const bogusTokens = layout.calculateFinalTokens(bogus).flat(2);
        expect(bogusTokens[0].bounds.height).toEqual(0);
        expect(bogusTokens[0].bounds.width).toEqual(
          controlTokens[0].bounds.width
        );
      });
      it("Should convert negative numbers to 0", () => {
        const bogus = makeExample({ fontScaleWidth: -1 });
        const bogusTokens = layout.calculateFinalTokens(bogus).flat(2);
        expect(bogusTokens[0].bounds.width).toEqual(0);
      });
    });

    describe("splitStyle", () => {
      it("Should split on whitespace by default", () => {
        const lws = {
          children: ["Lines, words, & segments!"],
          tags: "",
          style: noStyle,
        };
        const result = layout.calculateFinalTokens(lws);

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
        const helloWorldStyledTokens = {
          children: ["Hello, world!"],
          tags: "",
          style: noStyle,
        };
        const helloWorld = layout.calculateFinalTokens(
          helloWorldStyledTokens,
          "characters"
        );

        expect(helloWorld).toMatchObject([
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
      describe("Should respect letterSpacing property under splitStyle='characters'", () => {
        test("See section below labeled `letterSpacing`", () => {
          expect(true).toBeTruthy();
        });
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

    describe("paragraphSpacing", () => {
      const text = `line0
line1\nline2 goes on until it wraps to line3
<negative>line4
line5</negative>`;

      const stylesControl: TextStyleSet = {
        default: {
          fontSize: 16,
          wordWrap: true,
          wordWrapWidth: 150,
        },
        negative: {},
      };
      const styles: TextStyleSet = {
        default: { ...stylesControl.default, paragraphSpacing: 10 },
        negative: {
          paragraphSpacing: -10,
        },
      };

      const tagTokensControl = textToTags(text, Object.keys(stylesControl));
      const tagTokens = textToTags(text, Object.keys(styles));
      const styleTokensControl = tagsToStyles(tagTokensControl, stylesControl);
      const styleTokens = tagsToStyles(tagTokens, styles);
      const tokensControl = layout.calculateFinalTokens(styleTokensControl);
      const tokens = layout.calculateFinalTokens(styleTokens);
      const [
        line0Control,
        line1Control,
        line2Control,
        line3Control,
        line4Control,
        line5Control,
      ] = tokensControl;
      const [line0, line1, line2, line3, line4, line5] = tokens;

      const yOf = (line: LineToken) => line[0][0].bounds.y;
      const distanceBetween = (lineB: LineToken, lineA: LineToken) =>
        yOf(lineB) - yOf(lineA);

      const { ascent, descent } = line0Control[0][0].fontProperties;
      const lineSpacing = ascent + descent;

      const distanceBetweenNormalLines = distanceBetween(line3, line2);
      const distanceBetweenParagraphs = distanceBetween(line1, line0);
      const distanceBetweenParagraphsSlashN = distanceBetween(line2, line1);
      const distanceBetweenParagraphsNegative = distanceBetween(line5, line4);

      test("Control works as expected", () => {
        expect(line0Control[0][0].content).toBe("line0");
        expect(line1Control[0][0].content).toBe("line1");
        expect(line2Control[0][0].content).toBe("line2");
        expect(line3Control[0][0].content).toBe("wraps");
        expect(line3Control[4][0].content).toBe("line3");
        expect(line4Control[0][0].content).toBe("line4");
        expect(line5Control[0][0].content).toBe("line5");

        expect(yOf(line0Control)).toBe(lineSpacing * 0);
        expect(yOf(line1Control)).toBe(lineSpacing * 1);
        expect(yOf(line2Control)).toBe(lineSpacing * 2);
        expect(yOf(line3Control)).toBe(lineSpacing * 3);
        expect(yOf(line4Control)).toBe(lineSpacing * 4);
        expect(yOf(line5Control)).toBe(lineSpacing * 5);
      });
      test("That line breaks happen as expected", () => {
        expect(line0[0][0].content).toBe("line0");
        expect(line1[0][0].content).toBe("line1");
        expect(line2[0][0].content).toBe("line2");
        expect(line3[0][0].content).toBe("wraps");
        expect(line3[4][0].content).toBe("line3");
        expect(line4[0][0].content).toBe("line4");
        expect(line5[0][0].content).toBe("line5");
      });
      it("Should draw the first line at 0", () => {
        expect(yOf(line0)).toBe(0);
      });
      it("Shouldn't change normal lines without hard returns", () => {
        expect(distanceBetweenNormalLines).toBe(lineSpacing);
      });
      it("Should add extra space after newline characters when you use paragraphSpacing.", () => {
        expect(distanceBetweenParagraphs).toBe(distanceBetweenNormalLines + 10);
      });
      it("Should work the same for \\n or newlines in template strings.", () => {
        expect(distanceBetweenParagraphs).toBe(distanceBetweenParagraphsSlashN);
      });
      it("Should work with negative values.", () => {
        expect(distanceBetweenParagraphsNegative).toBe(
          distanceBetweenNormalLines - 10
        );
      });
    });

    describe("letterSpacing", () => {
      const LS = 10;
      const letterSpacingStyle = { letterSpacing: LS } as TextStyleExtended;

      const unstyledTokens = {
        children: ["Hello, world!"],
        tags: "",
        style: noStyle,
      } as StyledTokens;
      const styledTokens = {
        ...unstyledTokens,
        style: letterSpacingStyle,
      } as StyledTokens;

      const charSplitControl = layout.calculateFinalTokens(
        unstyledTokens,
        "characters"
      );
      const charSplitTest = layout.calculateFinalTokens(
        styledTokens,
        "characters"
      );
      const wordSplitControl = layout.calculateFinalTokens(
        unstyledTokens,
        "words"
      );
      const wordSplitTest = layout.calculateFinalTokens(styledTokens, "words");

      describe("Should respect letterSpacing property with various splitStyles", () => {
        describe("splitStyle='words' with letterSpacing'", () => {
          const controlTokens = wordSplitControl;
          const testTokens = wordSplitTest;

          const [helloControl, spaceControl, worldControl] =
            controlTokens.flat(2);
          const [helloTest, spaceTest, worldTest] = testTokens.flat(2);

          const helloControlWidth = helloControl.bounds.width;
          const spaceControlWidth = spaceControl.bounds.width;
          const worldControlWidth = worldControl.bounds.width;

          const helloTestWidth = helloTest.bounds.width;
          const spaceTestWidth = spaceTest.bounds.width;

          it("Should add letterspacing to spaces.", () => {
            expect(spaceTestWidth).toEqual(spaceControlWidth + LS);
          });

          test("check control - positions of non letterspaced text", () => {
            expect(helloControl).toMatchObject({
              content: "Hello,",
              bounds: { x: 0 },
            });
            expect(worldControl).toMatchObject({
              content: "world!",
              bounds: { x: helloControlWidth + spaceControlWidth },
            });
          });
          test("check positoins of letterspaced text", () => {
            expect(helloTest).toMatchObject({
              content: "Hello,",
              bounds: {
                x: 0,
                width:
                  helloControlWidth + (helloTest.content as string).length * LS,
              },
            });
            expect(worldTest).toMatchObject({
              content: "world!",
              bounds: {
                x: helloTestWidth + spaceTestWidth,
                width:
                  worldControlWidth + (worldTest.content as string).length * LS,
              },
            });
          });
        });
        describe("splitStyle='characters' with letterSpacing'", () => {
          const controlTokens = charSplitControl;
          const testTokens = charSplitTest;

          const [HControl, eControl, , , , , spaceControl] =
            controlTokens.flat(2);
          const [HTest, eTest, , , , , spaceTest] = testTokens.flat(2);

          const HControlWidth = HControl.bounds.width;
          const eControlWidth = eControl.bounds.width;
          const spaceControlWidth = spaceControl.bounds.width;

          const HTestWidth = HTest.bounds.width;
          const spaceTestWidth = spaceTest.bounds.width;

          it("Should add letterspacing to spaces.", () => {
            expect(spaceControl.content).toBe(" ");
            expect(spaceTest.content).toBe(" ");
            expect(spaceTestWidth).toEqual(spaceControlWidth + LS);
          });

          test("check control - positions of non letterspaced text", () => {
            expect(HControl).toMatchObject({
              content: "H",
              bounds: { x: 0 },
            });
            expect(eControl).toMatchObject({
              content: "e",
              bounds: { x: HControlWidth },
            });
          });

          test("check positoins of letterspaced text", () => {
            expect(HTest).toMatchObject({
              content: "H",
              bounds: { x: 0, width: HControlWidth + LS },
            });
            expect(eTest).toMatchObject({
              content: "e",
              bounds: { x: HTestWidth, width: eControlWidth + LS },
            });
          });
        });

        describe("icons with(( letterSpacing", () => {
          const createIcon = (letterSpacing: number): StyledTokens =>
            ({
              tags: "icon",
              children: [cloneSprite(icon)],
              style: { imgDisplay: "icon", letterSpacing },
            } as StyledTokens);

          const createTokens = (letterSpacing: number): ParagraphToken =>
            layout.calculateFinalTokens({
              children: [
                createIcon(letterSpacing),
                createIcon(letterSpacing),
                createIcon(letterSpacing),
              ],
              tags: "",
              style: {},
            } as StyledTokens);

          const iconsControl = createTokens(0);
          const iconsTest = createTokens(LS);
          const [aControl, bControl, cControl] = iconsControl.flat(2);
          const [a, b, c] = iconsTest.flat(2);

          const w = aControl.bounds.width;

          test("control case shouldn't add space between icons.", () => {
            expect(aControl.bounds.x).toBe(0);
            expect(bControl.bounds.x).toBe(w);
            expect(cControl.bounds.x).toBe(w * 2);
          });

          it("Should add letterSpacing between icons", () => {
            expect(a.bounds.x).toBe(0);
            expect(b.bounds.x).toBe(w + LS);
            expect(c.bounds.x).toBe(2 * (w + LS));
          });
        });
      });
    });
  });

  describe("end to end conversion", () => {
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
