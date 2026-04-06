import { LogLevel } from '@nestjs/common';
import { BaseLogger } from './base-logger.service';

export class CloudLogger extends BaseLogger {
  protected formatPid(pid: number) {
    return String(pid);
  }

  protected formatContext(context: string): string {
    return context;
  }

  protected formatTimestampDiff(timestampDiff: number): string {
    return `${timestampDiff}ms`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected colorize(message: string, _logLevel: LogLevel) {
    return message;
  }
}
