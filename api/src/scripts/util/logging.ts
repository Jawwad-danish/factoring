import Big from 'big.js';
import { isPromise } from 'util/types';

export function differenceInSeconds(
  timestamp1: number,
  timestamp2: number,
): string {
  const seconds1 = new Big(timestamp1).div(1000);
  const seconds2 = new Big(timestamp2).div(1000);

  const difference = seconds1.minus(seconds2).abs();

  return difference.toFixed(3);
}

export function logExecutionTime<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> {
  return function (...args: Parameters<T>): ReturnType<T> {
    const startTime = Date.now();

    const result = fn.apply(this, args);

    if (isPromise(result)) {
      return (async () => {
        await result;
        const endTime = Date.now();
        console.log(
          `Execution time for ${
            fn.name || 'anonymous function'
          }: ${differenceInSeconds(endTime, startTime)} seconds`,
        );
        return result;
      })() as ReturnType<T>;
    } else {
      const endTime = Date.now();
      console.log(
        `Execution time for ${
          fn.name || 'anonymous function'
        }: ${differenceInSeconds(endTime, startTime)} seconds`,
      );
      return result;
    }
  };
}
