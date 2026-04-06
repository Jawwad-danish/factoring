import { Duration, delay } from '@core/date-time';
import { HttpException, HttpStatus } from '@nestjs/common';

export const retryWithHandledTimeout = async <T>(
  operation: () => Promise<T>,
  options?: {
    times: number;
    fallback: () => Promise<null | T>;
    delay: Duration;
  },
) => {
  try {
    return await operation();
  } catch (error) {
    if (error.cause?.response === 'socket hang up') {
      return null;
    }
    if (error.cause && error.cause instanceof HttpException) {
      const httpError = error.cause;
      const status = httpError.getStatus();

      if (
        status === HttpStatus.GATEWAY_TIMEOUT ||
        status === HttpStatus.SERVICE_UNAVAILABLE
      ) {
        if (!options) {
          return null;
        }
        for (let i = 0; i < options.times; i++) {
          const result = await options.fallback();
          if (result) {
            return result;
          }
          await delay(options.delay.toMilliseconds().asNumber());
        }
        return null;
      }

      // https://bobtail.atlassian.net/browse/IC-2698
      if (status === HttpStatus.BAD_REQUEST) {
        const response = error.cause?.response?.toLowerCase();
        if (
          response.includes('api.sendgrid.com') ||
          response.includes('error sending email')
        ) {
          return null;
        }
      }
    }
    throw error;
  }
};
