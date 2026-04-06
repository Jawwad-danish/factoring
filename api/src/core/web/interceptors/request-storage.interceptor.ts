import {
  RequestMethod,
  RequestStorageEntity,
} from '@module-persistence/entities';
import { RequestStorageRepository } from '@module-persistence/repositories';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { AppContextHolder } from '../../app-context';

@Injectable()
export class RequestStorageInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(RequestStorageInterceptor.name);

  constructor(private repository: RequestStorageRepository) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    if (context.getType() === 'http') {
      const request: Request = context.switchToHttp().getRequest();
      try {
        await this.saveRequest(request);
      } catch (error) {
        this.logger.error(`Could not save request data`, {
          body: request.body,
          method: request.method,
          originalUrl: request.originalUrl,
          ip: request.ip,
          error: error.message,
        });
      }
    }
    return next.handle();
  }

  async saveRequest(request: Request) {
    const method = request.method.toLocaleUpperCase();
    const shouldSkip = request.get('Skip-Storage') || '';
    if (
      ['PATCH', 'POST', 'PUT', 'DELETE'].includes(method) &&
      !(shouldSkip.toLocaleLowerCase() === 'true')
    ) {
      const entity = new RequestStorageEntity();
      entity.method = method as RequestMethod;
      entity.payload = request.body || {};
      entity.route = request.originalUrl;
      entity.createdBy =
        AppContextHolder.get().getAuthentication().principal.id;
      entity.correlationId = AppContextHolder.get().correlationId;
      this.logger.debug('Sending request for saving', {
        route: request.originalUrl,
        method: method,
      });
      await this.repository.persistAndFlush(entity);
    } else {
      this.logger.verbose('Skipped GET request for storage');
    }
    return request;
  }
}
