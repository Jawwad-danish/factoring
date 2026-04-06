import { Logger } from '@nestjs/common';
import { Authentication } from './authentication.model';

export class AppContextError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export interface AppContext {
  correlationId: string;
  agent: string;
  accessToken: string;
  setAuthentication(authentication: Authentication): void;
  getAuthentication(): Authentication;
  isAuthenticated(): boolean;
}

abstract class BaseAppContext implements AppContext {
  constructor(
    readonly correlationId: string,
    readonly agent: string,
    readonly accessToken: string,
  ) {}

  isAuthenticated(): boolean {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAuthentication(_authentication: Authentication): void {
    throw new Error('Method not implemented.');
  }

  getAuthentication(): Authentication {
    throw new Error('Method not implemented.');
  }
}

export class AsyncAppContext extends BaseAppContext implements AppContext {
  private authentication: Authentication;

  isAuthenticated(): boolean {
    return Boolean(this.authentication);
  }

  setAuthentication(authentication: Authentication): void {
    this.authentication = authentication;
  }

  getAuthentication(): Authentication {
    if (!this.authentication) {
      throw new AppContextError(
        `Could not obtain Authentication because it's not set`,
      );
    }
    return this.authentication;
  }
}

export class GlobalAppContext extends BaseAppContext implements AppContext {
  static INSTANCE: AppContext = new GlobalAppContext();
  private logger = new Logger(GlobalAppContext.name);

  private constructor() {
    super('', '', '');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAuthentication(_authentication: Authentication): void {
    this.logger.warn('Authentication not set because of global context');
  }

  getAuthentication(): Authentication {
    return Authentication.getSystem();
  }

  isAuthenticated(): boolean {
    return Boolean(this.getAuthentication());
  }
}
