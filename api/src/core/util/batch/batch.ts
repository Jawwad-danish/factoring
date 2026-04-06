export const batch = <T>(items: T[], batchSize: number): Array<T[]> => {
  const result: Array<T[]> = [];
  const batches = Math.ceil(items.length / batchSize);
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = start + batchSize;
    result.push(items.slice(start, end));
  }
  return result;
};

export const batchProcess = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<null | R>,
): Promise<R[]> => {
  const handled: R[] = [];
  const batches = batch(items, batchSize);
  for (const chunk of batches) {
    const toProcess = chunk.map(processor);
    const processed = await Promise.all(toProcess);
    for (const item of processed) {
      if (item != null) {
        handled.push(item);
      }
    }
  }
  return handled;
};
