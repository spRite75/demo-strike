import { DateTime } from "luxon";

/**
 * Creates an array of elements split into groups the length of size.
 * https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_chunk
 * @param input
 * @param size
 * @returns
 */
export function chunk<T>(input: T[], size: number) {
  return input.reduce((arr: T[][], item: T, idx: number) => {
    return idx % size === 0
      ? [...arr, [item]]
      : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
  }, [] as T[][]);
}

export function notNullish<T>(value: T | null | undefined): value is T {
  return !!value;
}

export type ResolvedReturnType<T> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? R
  : never;

/**
 * Use with `Array.prototype.sort` to specify how to sort an array.
 * @param key key to order by
 * @param order ascending or descending order
 * @returns
 */
export function orderBy<T>(
  key: keyof T,
  order: "asc" | "desc"
): (a: T, b: T) => -1 | 0 | 1 {
  return (a, b) => {
    let aVal = a[key];
    let bVal = b[key];

    if (typeof aVal === "string" && typeof bVal === "string") {
      aVal = aVal.toLocaleLowerCase() as unknown as T[keyof T];
      bVal = bVal.toLocaleLowerCase() as unknown as T[keyof T];
    }

    switch (order) {
      case "asc": {
        return aVal > bVal ? 1 : bVal > aVal ? -1 : 0;
      }
      case "desc": {
        return aVal < bVal ? 1 : bVal < aVal ? -1 : 0;
      }
    }
  };
}

/**
 * Returns an interface stripped of all keys that don't resolve to U, defaulting
 * to a non-strict comparison of T[key] extends U. Setting B to true performs
 * a strict type comparison of T[key] extends U & U extends T[key]
 *
 * https://stackoverflow.com/a/60206860
 */
type KeysOfType<T, U, B = false> = {
  [P in keyof T]: B extends true
    ? T[P] extends U
      ? U extends T[P]
        ? P
        : never
      : never
    : T[P] extends U
    ? P
    : never;
}[keyof T];

type PickByType<T, U, B = false> = Pick<T, KeysOfType<T, U, B>>;
type GqlScalars = string | number | boolean | DateTime;
export type GqlMapper<T> = T extends object
  ? Partial<T> & PickByType<T, GqlScalars, true>
  : T;
