export const combineRecords = <
  A extends Record<string, unknown>,
  B extends Record<string, unknown> = A
>(
  a: A,
  b: B
): A & B => ({
  ...a,
  ...b,
});
