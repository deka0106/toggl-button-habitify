export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retry = async <T>(
  fn: () => T | undefined | null,
  ms: number = 100,
  count: number = 10
): Promise<T | null> => {
  if (count === 0) return null;
  await sleep(ms);
  return (await fn()) ?? retry(fn, ms, count - 1);
};

export const notNull = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;
