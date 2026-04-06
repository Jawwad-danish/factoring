import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, Logger, format, transports } from 'winston';
const { combine, timestamp, json, uncolorize } = format;

@Injectable()
export class LambdaLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    const logFormatter = {
      format: combine(timestamp(), json(), uncolorize()),
    };

    const logLevel = process.env.LOG_LEVEL || 'info';

    const logTransports = {
      console: new transports.Console({
        level: logLevel,
      }),
    };
    this.logger = createLogger({
      format: logFormatter.format,
      transports: [logTransports.console],
    });
  }

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, ...optionalParams);
  }

  debug?(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logger.verbose(message, ...optionalParams);
  }
}
