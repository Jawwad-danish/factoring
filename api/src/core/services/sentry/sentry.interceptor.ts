import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CauseAwareError } from '../../errors';
import { AppContextHolder } from '@core/app-context';

@Injectable()
export class SentryExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof CauseAwareError && !error.skipObservability()) {
          Sentry.withScope((scope) => {
            const request = context.switchToHttp().getRequest();
            const payload = request.body;

            scope.setTag('controller', context.getClass().name);
            scope.setExtra('request_payload', payload);
            scope.setExtra(
              'correlationId',
              AppContextHolder.get().correlationId,
            );
            scope.setTag(
              'handler',
              `${context.getClass().name}#${context.getHandler().name}`,
            );
            scope.setTag('error', error.constructor.name);
            Sentry.captureException(error);
          });
        }

        return throwError(() => error);
      }),
    );
  }
}
