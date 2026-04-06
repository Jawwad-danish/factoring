import { AppContextHolder } from '@core/app-context';
import { ConsoleLogger, Inject, LogLevel } from '@nestjs/common';
import { CONFIG_SERVICE, Config, ConfigService } from '../bobtail-config';

const LOG_LEVEL_KEY = 'LOG_LEVEL';
const validLogLevels: LogLevel[] = ['debug', 'verbose', 'log', 'warn', 'error']; // for runtime checking
const loggerConfigContext = 'logger-config';

/**
 * Log level order: https://github.com/nestjs/nest/blob/master/packages/common/services/utils/is-log-level-enabled.util.ts
 */

export class BaseLogger extends ConsoleLogger {
  constructor(@Inject(CONFIG_SERVICE) private configService: ConfigService) {
    super();
    this.configService
      .observeValue(LOG_LEVEL_KEY)
      .subscribe((config) => this.onLogLevelChange(config));
  }

  onLogLevelChange(config: Config) {
    const logLevel = config.asString().toLocaleLowerCase() as LogLevel;
    if (validLogLevels.includes(logLevel)) {
      this.log(`Setting log level to ${logLevel}`, loggerConfigContext);
      this.setLogLevels([logLevel]);
    } else {
      this.error(
        `Invalid log level ${logLevel}. Log level was not updated.`,
        loggerConfigContext,
      );
    }
  }

  protected printMessages(
    messages: unknown[],
    context?: string | undefined,
    logLevel?: LogLevel | undefined,
    writeStreamType?: 'stdout' | 'stderr' | undefined,
  ): void {
    const filteredMessages = messages.filter((message) => message);
    if (filteredMessages.length === 2) {
      if (
        typeof messages[0] === 'string' &&
        typeof filteredMessages[1] === 'object'
      ) {
        return super.printMessages(
          [
            {
              message: filteredMessages[0],
              payload: filteredMessages[1],
            },
          ],
          context,
          logLevel,
          writeStreamType,
        );
      }
    }
    return super.printMessages(
      filteredMessages,
      context,
      logLevel,
      writeStreamType,
    );
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    _formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    const stringify = JSON.stringify({
      logger: {
        level: logLevel,
        context: contextMessage,
        pid: pidMessage,
      },
      data: {
        correlationId: this.getCorrelationId(),
        agent: this.getAgent(),
        email: this.getPrincipalEmail(),
        timestamp: {
          value: this.getTimestamp(),
          diff: timestampDiff,
        },
        message: message,
      },
    });
    return `${stringify}\n`;
  }

  protected getPrincipalEmail(): string {
    const appContext = AppContextHolder.get();
    return appContext.isAuthenticated()
      ? appContext.getAuthentication().principal.email
      : 'no-principal-email';
  }

  protected getCorrelationId(): string {
    return AppContextHolder.get().correlationId;
  }

  protected getAgent(): string {
    return AppContextHolder.get().agent;
  }
}
