import { Logger } from '@nestjs/common';

const logger = new Logger('timers');

export const runPeriodically = (
  toExecute: () => Promise<any>,
  timeoutInSeconds: number,
  stopOnError = true,
): NodeJS.Timeout => {
  const interval = setInterval(() => {
    toExecute()
      .then()
      .catch((error) => {
        logger.error('Periodically execution failed due to error', error);
        if (stopOnError) {
          clearInterval(interval);
        }
      });
  }, timeoutInSeconds * 1000);
  return interval;
};
