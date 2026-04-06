import { AsyncLocalStorage } from 'async_hooks';
import { Request } from 'express';
import { AppContext, AsyncAppContext, GlobalAppContext } from './app-context';
import { UUID } from '../util';
import { Authentication } from './authentication.model';

export class AppContextHolder {
  private static storage = new AsyncLocalStorage<AppContext>();

  static get(): AppContext {
    return this.storage.getStore() ?? GlobalAppContext.INSTANCE;
  }

  static global(): AppContext {
    return GlobalAppContext.INSTANCE;
  }

  static create(req: Request, callback: (...args: any[]) => void): void {
    const correlationId: string = req.header('x-correlation-id') ?? UUID.get();
    const agent: string = req.header('agent') ?? '';
    const accessToken: string = req.header('authorization') ?? '';
    const context = new AsyncAppContext(correlationId, agent, accessToken);
    this.storage.run(context, callback);
  }

  static createForWorker(
    correlationId: string,
    callback: (...args: any[]) => void,
  ): void {
    const context = new AsyncAppContext(correlationId, 'worker', '');
    context.setAuthentication(Authentication.getSystem());
    this.storage.run(context, callback);
  }
}
