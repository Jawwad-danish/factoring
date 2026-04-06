import { AppContextHolder } from '@core/app-context';
import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';

export function enableRequestContextHelper(app: INestApplication) {
  const databaseService = app.get<DatabaseService>(DatabaseService);
  app.use((_req: Request, _res: Response, next: (...args: any[]) => void) => {
    databaseService.withRequestContext(next);
  });
  app.use((req: Request, _res: Response, next: (...args: any[]) => void) => {
    AppContextHolder.create(req, next);
  });
}

export function enableCors(app: INestApplication) {
  app.enableCors({
    origin: environment.core.origins(),
  });
}

export function enableValidation(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        excludeExtraneousValues: false,
        exposeDefaultValues: true,
      },
    }),
  );
}

export function configureOpenAPI(app: INestApplication) {
  const logger = new Logger('open-api');
  if (environment.isProduction()) {
    logger.warn('OpenAPI is not initialized on production environment');
    return;
  }

  logger.log('OpenAPI is initialized');
  const config = new DocumentBuilder()
    .setTitle('Invoice Creation API 2.0')
    .setDescription('Invoice Creation API 2.0')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'token',
    )
    .addSecurityRequirements('token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
