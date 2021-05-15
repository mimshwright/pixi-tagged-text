import { Nested } from "./types";

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

export const assoc = <T extends Record<string, U>, U extends unknown>(
  key: keyof T
) => (value: U) => (object: T): T => ({
  ...object,
  ...{ [key]: value },
});

export const mapProp = <T, U>(k: keyof U) => (f: (t: T) => T) => (o: U): U => ({
  ...o,
  [k]: f((o as U & Record<string, T>)[k]),
});

// export const every = <T>(p: Predicate<T>) => (a: T[]): boolean => a.every(p);

export const flatReduce = <T, U>(f: (acc: U, t: T) => U, acc: U) => (
  nested: Nested<T>
): U => [nested].flat(255).reduce(f, acc);

type FlatReduceRetrun<T, U> = (nested: Nested<T>) => U;

export const flatEvery = <T>(p: Predicate<T>): FlatReduceRetrun<T, boolean> =>
  flatReduce<T, boolean>((acc: boolean, t: T) => acc && p(t), true);

export const nestedMap = <T, U>(f: (t: T) => U) => (
  nested: Nested<T>
): Nested<U> =>
  nested instanceof Array ? nested.map(nestedMap(f)) : f(nested);

export const countIf = <T>(p: Predicate<T>) => (a: Array<T>): number =>
  a.reduce((count, item) => (p(item) ? count + 1 : count), 0);

export type Unary<Param, Return> = (p: Param) => Return;
