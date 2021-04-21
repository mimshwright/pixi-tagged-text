import {
  createEmptyFinalToken,
  FinalToken,
  ParagraphToken,
  StyledToken,
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
  });
  it("Should throw if the method is unknown.", () => {
    expect(() => {
      splitText("abc", "bogus" as SplitStyle);
    }).toThrow();
  });
});

describe("calculateFinalTokens()", () => {
  it("Should exist", () => {
    expect(layout.calculateFinalTokens).toBeInstanceOf(Function);
  });

  it("Should throw if the styledToken has no style", () => {
    expect(() => {
      const fakeStyled = { children: ["No styles?"], tags: "" } as StyledToken;
      layout.calculateFinalTokens(fakeStyled);
    }).toThrow();
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
    it("Should collapse the width of any whitespace characters that appear at end of lines. (but not in middle)", () => {
      const example: Partial<FinalToken>[][][] = [
        [
          [{ content: "a", bounds: R(0, 0, 10, 10) }],
          [{ content: " ", bounds: R(10, 0, 10, 10) }],
          [{ content: "b", bounds: R(20, 0, 10, 10) }],
          [{ content: " ", bounds: R(30, 0, 10, 10) }],
          [{ content: " ", bounds: R(40, 0, 10, 10) }],
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
    it("Should work the same with newlines", () => {
      const example: Partial<FinalToken>[][][] = [
        [
          [{ content: "a", bounds: R(0, 0, 10, 10) }],
          [{ content: "\n", bounds: R(10, 0, 10, 10) }],
        ],
        [
          [{ content: "b", bounds: R(0, 10, 10, 10) }],
          [{ content: " ", bounds: R(10, 10, 10, 10) }],
          [{ content: "\n", bounds: R(20, 10, 10, 10) }],
        ],
        [[{ content: "c", bounds: R(0, 0, 20, 10) }]],
      ];
      const result = layout.collapseWhitespacesOnEndOfLines(
        example as ParagraphToken
      );
      expect(result).toMatchObject([
        [
          [{ content: "a", bounds: R(0, 0, 10, 10) }],
          [{ content: "\n", bounds: R(10, 0, 0, 10) }],
        ],
        [
          [{ content: "b", bounds: R(0, 10, 10, 10) }],
          [{ content: " ", bounds: R(10, 10, 0, 10) }],
          [{ content: "\n", bounds: R(20, 10, 0, 10) }],
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
    const styles = {
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

// describe.skip("verticalAlignInLines()", () => {
//   const lines = [
//     [R(0, 0, W, 20), R(100, 0, W, 40)],
//     [R(0, 30, W, 30), R(100, 30, W, 40), R(200, 30, W, 10)],
//     [R(0, 60, W, 20)],
//   ];

//   const top = layout.verticalAlignInLines(lines, 0);
//   const bottom = layout.verticalAlignInLines(lines, 0);
//   const middle = layout.verticalAlignInLines(lines, 0);
//   it("should position text vertically in a line so that it fits correctly.", () => {
//     expect(top).toMatchObject([
//       [{ y: 0 }, { y: 0 }],
//       [{ y: 0 }, { y: 0 }, { y: 0 }],
//       [{ y: 0 }],
//     ]);
//     expect(bottom).toMatchObject([
//       [{ y: 20 }, { y: 0 }],
//       [{ y: 10 }, { y: 0 }, { y: 30 }],
//       [{ y: 0 }],
//     ]);
//     expect(middle).toMatchObject([
//       [{ y: 10 }, { y: 0 }],
//       [{ y: 5 }, { y: 0 }, { y: 15 }],
//       [{ y: 0 }],
//     ]);
//   });
//   it("should create a new object rather than editing the original.", () => {
//     expect(top[0]).not.toBe(lines[0]);
//     expect(top[0][0]).not.toBe(lines[0][0]);
//     expect(middle[0]).not.toBe(lines[0]);
//     expect(middle[0][0]).not.toBe(lines[0][0]);
//     expect(bottom[0]).not.toBe(lines[0]);
//     expect(bottom[0][0]).not.toBe(lines[0][0]);
//   });
// });
