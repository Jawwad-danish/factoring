import { Logger } from '@nestjs/common';
import { CauseAwareError } from '../../errors';
import { AnyFunction, FunctionsOnly, TypeFunction } from '../../types';

const internalLogger = new Logger('@CrossCuttingConcerns()');

export interface ErrorOptions {
  errorSupplier: (cause: Error, ...args: any[]) => CauseAwareError;
}

export interface LoggingOptions {
  message: string;
  payload?: any;
}

export interface ObservabilityOptions {
  tag: [string, string];
  failSilently?: boolean;
}

export interface CrossCuttingConcernsOptions<
  LoggingType extends TypeFunction<LoggingOptions>,
> {
  logging: LoggingType;
  observability?: ObservabilityOptions;
  error?: ErrorOptions;
}

export function CrossCuttingConcerns<
  TargetType extends object,
  Method extends FunctionsOnly<TargetType>,
  LoggingType extends TypeFunction<LoggingOptions> = TargetType[Method] extends AnyFunction
    ? (...args: Parameters<TargetType[Method]>) => LoggingOptions
    : never,
>(options: CrossCuttingConcernsOptions<LoggingType>): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const logger: Logger = (this as any).logger ?? internalLogger;
      const loggingOptions = options.logging(...args);
      logger.debug(`Start: ${loggingOptions.message}`, loggingOptions.payload);

      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        logger.error(error.message);
        if (!options.observability?.failSilently) {
          if (options.error) {
            const toThrow = options.error.errorSupplier(error, ...args);
            throw toThrow;
          }
          throw error;
        }
      } finally {
        logger.debug(`End: ${loggingOptions.message}`, loggingOptions.payload);
      }
    };
    return descriptor;
  };
}
