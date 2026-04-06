import { AuthorizationError } from '@core/errors';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch(AuthorizationError)
export class AuthorizationErrorFilter implements ExceptionFilter {
  catch(exception: AuthorizationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(403).json({
      statusCode: 403,
      error: exception.message,
    });
  }
}
