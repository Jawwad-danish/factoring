import { AppContextHolder } from '@core/app-context';
import { CauseAwareError } from '@core/errors';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { slackErrorBlockBuilder } from './block-builders';
import { SLACK_SERVICE } from './slack.provider';
import { SlackService } from './slack.service';

@Injectable()
export class SlackExceptionInterceptor implements NestInterceptor {
  constructor(
    @Inject(SLACK_SERVICE) private readonly slackService: SlackService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof CauseAwareError && !error.skipObservability()) {
          let request: any = '';
          if (ctx.getType() === 'http') {
            request = ctx.switchToHttp().getRequest().body;
          }
          this.slackService.postErrorMessage(
            'Something has happened:',
            slackErrorBlockBuilder({
              error: error.id,
              cause: error.message,
              correlationId: AppContextHolder.get().correlationId,
              user: AppContextHolder.get().getAuthentication().principal.email,
              request: request ? JSON.stringify(request) : 'No request body',
              reason: error.cause?.stack ?? 'No error stack trace',
            }),
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
