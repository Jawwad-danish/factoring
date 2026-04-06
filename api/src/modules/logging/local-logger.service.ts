import { stringify } from '@core/formatting';
import { LogLevel } from '@nestjs/common';
import { BaseLogger } from './base-logger.service';

export class LocalLogger extends BaseLogger {
  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    const output = this.doStringifyMessage(message, logLevel);
    pidMessage = this.colorize(pidMessage, logLevel);
    formattedLogLevel = this.colorize(formattedLogLevel, logLevel);
    const correlation = this.getCorrelationMessage();
    const agent = this.getAgentMessage();
    const principalEmail = this.getPrincipalEmailMessage();
    return `${this.getTimestamp()} ${formattedLogLevel} ${contextMessage}${correlation}${principalEmail}${agent} ${output}${timestampDiff}\n`;
  }

  private doStringifyMessage(message: unknown, logLevel: LogLevel): string {
    const toStringify =
      typeof message !== 'object' ? message : stringify(message);
    return this.stringifyMessage(toStringify, logLevel);
  }

  private getPrincipalEmailMessage(): string {
    const principalEmail = this.getPrincipalEmail();
    if (principalEmail) {
      return `[${this.colorize(principalEmail, 'warn')}]`;
    }
    return principalEmail;
  }

  private getCorrelationMessage(): string {
    const correlationId = this.getCorrelationId();
    if (correlationId) {
      return `[${this.colorize(correlationId, 'warn')}]`;
    }
    return correlationId;
  }

  private getAgentMessage(): string {
    const agent = this.getAgent();
    if (agent) {
      return `[${this.colorize(agent, 'warn')}]`;
    }
    return agent;
  }
}
