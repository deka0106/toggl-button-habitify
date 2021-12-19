export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retry = async <T>(
  fn: () => T,
  ms: number = 100,
  count: number = 10
): Promise<T | null> => {
  if (count === 0) return null;
  const ret = await fn();
  if (ret) return ret;
  await sleep(ms);
  return await retry(fn, ms, count - 1);
};

export const notNull = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined;
