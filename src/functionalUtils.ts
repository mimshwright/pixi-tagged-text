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

export const isEmptyObject = <T extends unknown>(a: T): boolean =>
  a instanceof Object && Object.keys(a).length === 0;
