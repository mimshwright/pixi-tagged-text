import { ParagraphToken } from "./../../src/types";
export const expectToBeBetween = (
  actual: number,
  low: number,
  high: number
): void => {
  expect(actual).toBeGreaterThanOrEqual(low);
  expect(actual).toBeLessThanOrEqual(high);
};

export const consoleLogLinesText = (lines: ParagraphToken, force = false) => {
  const method = force ? console.info : console.log;
  method(
    lines
      .map(
        (line, i) =>
          i +
          ": " +
          line
            .map((word) => word.map((segment) => segment.content).join(""))
            .join("")
      )
      .join("\n")
  );
};
