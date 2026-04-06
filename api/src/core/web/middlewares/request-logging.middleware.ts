import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger: Logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      const { statusCode, statusMessage } = res;
      const data = {
        request: {
          body: req.body,
          method: req.method,
          originalUrl: req.originalUrl,
          ip: req.ip,
        },
        response: {
          statusCode,
          statusMessage,
        },
      };

      if (statusCode < 400) {
        this.logger.log(data);
      } else {
        this.logger.error(data);
      }
    });
    next();
  }
}
