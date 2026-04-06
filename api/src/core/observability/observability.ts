import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { CaptureContext, MonitorConfig, Primitive } from '@sentry/types';

const cronLogger = new Logger('SentryCron');

export class Observability {
  static setTag(key: string, value: Primitive) {
    Sentry.getCurrentScope().setTag(key, value);
  }

  static captureError(error: Error) {
    Sentry.getCurrentScope().captureException(error);
  }

  static setTransactionName(name: string) {
    Sentry.getCurrentScope().setTransactionName(name);
  }

  static captureMessage(message: string, captureContext: CaptureContext) {
    Sentry.captureMessage(message, captureContext);
  }

  static WithScope(tag?: string) {
    return function (
      _target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor,
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        return Sentry.withScope((scope) => {
          scope.setTag('context', tag || propertyKey);

          return originalMethod.apply(this, args);
        });
      };

      return descriptor;
    };
  }

  static withMonitor<T>(
    monitorSlug: string,
    callback: () => Promise<T>,
    upsertMonitorConfig?: MonitorConfig,
  ): Promise<T | void> {
    return new Promise((resolve) => {
      Sentry.withScope(async () => {
        cronLogger.debug(`Starting sentry monitor for ${monitorSlug}`);
        try {
          const result = await Sentry.withMonitor(
            monitorSlug,
            callback,
            upsertMonitorConfig,
          );
          resolve(result);
        } catch (error) {
          cronLogger.error(error.message);
          resolve();
        } finally {
          cronLogger.debug(`Finished sentry monitor for ${monitorSlug}`);
        }
      });
    });
  }
}
