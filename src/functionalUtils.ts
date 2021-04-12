/**
 * a -> boolean
 */
type Predicate<T extends unknown> = (t: T) => boolean;

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

export const first = <T>(a: T[]): T => a[0];

/**
 * Return the last item in a list.
 * List f => f a -> a
 */
export const last = <T>(a: T[]): T => a[a.length - 1];

export const isDefined: Predicate<unknown | undefined> = (a): boolean =>
  a !== undefined;

/**
 * Predicate p => p -> p
 */
export const complement = <T extends unknown>(predicate: Predicate<T>) => (
  input: T
): boolean => !predicate(input);

/**
 * List f => string -> f {string: a} -> f a
 */
export const pluck = <T extends unknown, U extends unknown>(key: keyof U) => (
  objects: U[]
): T[] => (objects as (U & Record<string, T>)[]).map<T>((o) => o[key]);

export const assoc = <T extends unknown, U extends Record<string, unknown>>(
  key: string
) => (value: T) => (object: U): U => ({ ...object, [key]: value });
