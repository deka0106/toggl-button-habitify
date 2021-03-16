export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const wait = async <T>(
  callback: () => T | undefined | null,
  ms: number = 100
): Promise<T> => {
  while (true) {
    const ret = callback();
    if (ret) return ret;
    await sleep(ms);
  }
};
