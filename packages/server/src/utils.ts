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
