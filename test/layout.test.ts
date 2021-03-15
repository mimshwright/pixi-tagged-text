import * as PIXI from "pixi.js";
import * as layout from "../src/layout";

describe("layout module", () => {
  const W = 100;
  const H = 20;

  describe("calculateMeasurements()", () => {
    it("should be a function", () => {
      expect(layout.calculateMeasurements).toBeInstanceOf(Function);
    });
  });

  describe("translatePoint()", () => {
    const rect = new PIXI.Rectangle(10, 10, 20, 20);
    const offset = new PIXI.Point(15, -5);
    const result = layout.translatePoint(offset)(rect);
    it("should move a point-like object by an amount.", () => {
      expect(result).toMatchObject({
        x: 25,
        y: 5,
      });
    });
    it("should create a new object rather than editing the original.", () => {
      expect(result).not.toStrictEqual(rect);
      expect(result).toHaveProperty("width", 20);
    });
  });

  describe("translateLine()", () => {
    it("should offset several points (all the Measurements in a line)", () => {
      const line = [
        new PIXI.Rectangle(1, 1, 10, 10),
        new PIXI.Rectangle(2, 2, 10, 10),
        new PIXI.Rectangle(3, 3, 10, 10),
      ];
      const offset = new PIXI.Point(10, 20);
      const result = layout.translateLine(offset)(line);
      expect(result).toMatchObject([
        { x: 11, y: 21, width: 10, height: 10 },
        { x: 12, y: 22, width: 10, height: 10 },
        { x: 13, y: 23, width: 10, height: 10 },
      ]);
    });
  });

  describe("lineWidth()", () => {
    it("should get the total width of the words in a line of measurements.", () => {
      const line = [
        new PIXI.Rectangle(0, 30, 100, 20),
        new PIXI.Rectangle(100, 30, 100, 20),
        new PIXI.Rectangle(200, 30, 100, 20),
      ];
      expect(layout.lineWidth(line)).toBe(300);
    });
    it("should assume that the lines are sorted already left to right.", () => {
      const line = [
        new PIXI.Rectangle(0, 30, 100, 20),
        new PIXI.Rectangle(200, 30, 100, 20),
        new PIXI.Rectangle(100, 30, 100, 20),
      ];
      expect(layout.lineWidth(line)).toBe(200);
    });
    it("should account for positioning of first and last elements.", () => {
      const line = [
        new PIXI.Rectangle(50, 30, 100, 20),
        new PIXI.Rectangle(150, 30, 100, 20),
      ];
      expect(layout.lineWidth(line)).toBe(200);
    });
  });

  describe("justifyLine()", () => {
    it("should position the words in a line so that they fill the maximum possible space available. It should assume that the array is sorted left to right and that the words all fit inside the space.", () => {
      const line = [
        new PIXI.Rectangle(0, 30, 100, 20),
        new PIXI.Rectangle(100, 30, 75, 20),
        new PIXI.Rectangle(175, 30, 25, 20),
        new PIXI.Rectangle(200, 30, 100, 20),
        new PIXI.Rectangle(300, 30, 30, 20),
      ];

      const maxWidth = 500;
      const spaceSize = (500 - (100 + 75 + 25 + 100 + 30)) / 4;
      const result = layout.justifyLine(maxWidth)(line);
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
  });

  describe("alignTextInLines()", () => {
    it("should reposition items from lines of text (MeasurementLines) based on the alignment and width of container.", () => {
      const lines = [
        [new PIXI.Rectangle(0, 0, W, H), new PIXI.Rectangle(100, 0, W, H)],
        [
          new PIXI.Rectangle(0, 30, W, H),
          new PIXI.Rectangle(100, 30, W, H),
          new PIXI.Rectangle(200, 30, W, H),
        ],
        [new PIXI.Rectangle(0, 60, W, H)],
      ];

      const maxWidth = 400;

      const left = layout.alignTextInLines("left", maxWidth, lines);
      const center = layout.alignTextInLines("center", maxWidth, lines);
      const right = layout.alignTextInLines("right", maxWidth, lines);
      const justify = layout.alignTextInLines("justify", maxWidth, lines);

      expect(left).toMatchObject(lines);
      expect(center).toMatchObject([
        [{ x: (maxWidth - W * 2) / 2 }, { x: (maxWidth - W * 2) / 2 + W }],
        [
          { x: (maxWidth - W * 3) / 2 },
          { x: (maxWidth - W * 3) / 2 + W },
          { x: (maxWidth - W * 3) / 2 + W * 2 },
        ],
        [{ x: (maxWidth - W) / 2 }],
      ]);
      expect(right).toMatchObject([
        [{ x: maxWidth - W * 2 }, { x: maxWidth - W }],
        [{ x: maxWidth - W * 3 }, { x: maxWidth - W * 2 }, { x: maxWidth - W }],
        [{ x: maxWidth - W }],
      ]);

      const j = layout.justifyLine(maxWidth);
      expect(justify).toMatchObject([j(lines[0]), j(lines[1]), j(lines[2])]);
    });
  });
  describe("verticalAlignInLines()", () => {
    it("should position text vertically in a line so that it fits correctly.", () => {
      const lines = [
        [new PIXI.Rectangle(0, 0, W, 20), new PIXI.Rectangle(100, 0, W, 40)],
        [
          new PIXI.Rectangle(0, 30, W, 30),
          new PIXI.Rectangle(100, 30, W, 40),
          new PIXI.Rectangle(200, 30, W, 10),
        ],
        [new PIXI.Rectangle(0, 60, W, 20)],
      ];

      const top = layout.verticalAlignInLines("top", lines);
      const bottom = layout.verticalAlignInLines("bottom", lines);
      const middle = layout.verticalAlignInLines("middle", lines);

      expect(top).toMatchObject([
        [{ y: 0 }, { y: 0 }],
        [{ y: 0 }, { y: 0 }, { y: 0 }],
        [{ y: 0 }],
      ]);
      expect(bottom).toMatchObject([
        [{ y: 20 }, { y: 0 }],
        [{ y: 10 }, { y: 0 }, { y: 30 }],
        [{ y: 0 }],
      ]);
      expect(middle).toMatchObject([
        [{ y: 10 }, { y: 0 }],
        [{ y: 5 }, { y: 0 }, { y: 15 }],
        [{ y: 0 }],
      ]);
    });
  });
});
