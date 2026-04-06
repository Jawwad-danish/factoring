import { CauseAwareError, Reason } from '@core/errors';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(CauseAwareError)
export class CauseAwareErrorFilter implements ExceptionFilter {
  catch(error: CauseAwareError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(this.getStatusCode(error)).json(this.buildResponse(error));
  }

  private buildResponse(error: CauseAwareError, visited = new Set()) {
    if (visited.has(error)) {
      return {
        message: error.message,
        id: error.id,
      };
    }
    visited.add(error);

    const result: object = {
      message: error.message,
      id: error.id,
    };
    if (error.cause) {
      result['cause'] = this.buildCauseObject(error.cause, visited);
    }
    return result;
  }

  private buildCauseObject(cause: Error, visited: Set<any>): object {
    if (cause instanceof CauseAwareError) {
      return this.buildResponse(cause, visited);
    }
    if (cause instanceof HttpException) {
      return this.buildHttpExceptionCause(cause);
    }
    return {
      message: 'An unexpected internal error occurred',
    };
  }

  private buildHttpExceptionCause(exception: HttpException): object {
    const response = exception.getResponse();
    const message = this.extractMessageFromResponse(
      response,
      exception.message,
    );
    return {
      message,
      statusCode: exception.getStatus(),
    };
  }

  private extractMessageFromResponse(response: any, fallback: string): string {
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && response !== null) {
      if ('message' in response) {
        const msg = (response as any).message;
        return Array.isArray(msg) ? msg.join(', ') : msg;
      }
      return JSON.stringify(response);
    }
    return fallback;
  }

  private findHttpExceptionInCauseChain(error: any): HttpException | null {
    let current = error;
    const visited = new Set();

    while (current) {
      if (visited.has(current)) {
        break;
      }
      visited.add(current);

      if (current instanceof HttpException) {
        return current;
      }
      current = current.cause;
    }
    return null;
  }

  private getStatusCode(error: CauseAwareError): number {
    if (error.getReason() === Reason.ExternalServiceCall) {
      const httpException = this.findHttpExceptionInCauseChain(error);
      if (httpException) {
        return httpException.getStatus();
      }
      return 503;
    }

    switch (error.getReason()) {
      case Reason.Validation:
        return 400;

      case Reason.Missing:
        return 404;

      default:
        return 500;
    }
  }
}
