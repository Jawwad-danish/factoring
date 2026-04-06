import { UnexpectedQueryParamValueError } from '@core/errors';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch(UnexpectedQueryParamValueError)
export class UnexpectedValueErrorFilter implements ExceptionFilter {
  catch(exception: UnexpectedQueryParamValueError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(400).json({
      statusCode: 400,
      error: exception.message,
      message: [
        {
          property: exception.property,
          value: exception.value,
        },
      ],
    });
  }
}
