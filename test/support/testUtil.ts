export const expectToBeBetween = (
  actual: number,
  low: number,
  high: number
): void => {
  expect(actual).toBeGreaterThanOrEqual(low);
  expect(actual).toBeLessThanOrEqual(high);
};
