import * as PIXI from "pixi.js";
import * as layout from "../src/layout";

const R = (...args: number[]) => new PIXI.Rectangle(...args);

describe("layout module", () => {
  const W = 100;
  const H = 20;
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

  describe("calculateMeasurements()", () => {
    it("should be a function", () => {
      expect(layout.calculateMeasurements).toBeInstanceOf(Function);
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

  describe("alignTextInLines()", () => {
    // This function really just combines the other align functions and runs them
    // based on an `Align` string on multiple lines.

    const lines = [
      [R(0, 0, W, H), R(100, 0, W, H)],
      [R(0, 30, W, H), R(100, 30, W, H), R(200, 30, W, H)],
      [R(0, 60, W, H)],
    ];

    const right = layout.alignTextInLines("right", maxLineWidth, lines);
    const center = layout.alignTextInLines("center", maxLineWidth, lines);
    const left = layout.alignTextInLines("left", maxLineWidth, lines);
    const justify = layout.alignTextInLines("justify", maxLineWidth, lines);

    it("should reposition items from lines of text (MeasurementLines) based on the alignment and width of container.", () => {
      expect(right).toMatchObject([
        [{ x: maxLineWidth - W * 2 }, { x: maxLineWidth - W }],
        [
          { x: maxLineWidth - W * 3 },
          { x: maxLineWidth - W * 2 },
          { x: maxLineWidth - W },
        ],
        [{ x: maxLineWidth - W }],
      ]);
      expect(center).toMatchObject([
        [
          { x: (maxLineWidth - W * 2) / 2 },
          { x: (maxLineWidth - W * 2) / 2 + W },
        ],
        [
          { x: (maxLineWidth - W * 3) / 2 },
          { x: (maxLineWidth - W * 3) / 2 + W },
          { x: (maxLineWidth - W * 3) / 2 + W * 2 },
        ],
        [{ x: (maxLineWidth - W) / 2 }],
      ]);
      expect(left).toMatchObject([
        [{ x: W * 0 }, { x: W * 1 }],
        [{ x: W * 0 }, { x: W * 1 }, { x: W * 2 }],
        [{ x: W * 0 }],
      ]);

      expect(justify).toMatchObject([
        [{ x: 0 }, { x: maxLineWidth - W }],
        [
          { x: 0 },
          { x: (maxLineWidth - 3 * W) / 2 + W },
          { x: maxLineWidth - W },
        ],
        [{ x: 0 }],
      ]);
    });

    it("should create a new object rather than editing the original.", () => {
      expect(left[0]).not.toBe(lines[0]);
      expect(right[0]).not.toBe(lines[0]);
      expect(center[0]).not.toBe(lines[0]);
      expect(justify[0]).not.toBe(lines[0]);
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
});
