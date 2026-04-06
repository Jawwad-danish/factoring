import { environment } from '@core/environment';
import { configureSentry, SentryExceptionInterceptor } from '@core/services';
import {
  AuthorizationErrorFilter,
  CauseAwareErrorFilter,
  RequestStorageInterceptor,
  UnexpectedValueErrorFilter,
} from '@core/web';
import { LOGGER_PROVIDER } from '@module-logger';
import { SlackExceptionInterceptor } from '@module-slack';
import {
  INestApplication,
  Logger,
  LoggerService,
  NestInterceptor,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  configureOpenAPI,
  enableCors,
  enableRequestContextHelper,
  enableValidation,
} from './middlewares';
import { AppModule } from './modules/app/app.module';

function registerMiddlewares(app: INestApplication) {
  configureSentry(app);
  enableCors(app);
  enableValidation(app);
  enableRequestContextHelper(app);
  configureOpenAPI(app);
  app.useGlobalFilters(
    new UnexpectedValueErrorFilter(),
    new AuthorizationErrorFilter(),
    new CauseAwareErrorFilter(),
  );
  app.useLogger(app.get<LoggerService>(LOGGER_PROVIDER));
  const interceptors: NestInterceptor[] = [app.get(RequestStorageInterceptor)];
  if (environment.isStaging() || environment.isDevelopment()) {
    interceptors.push(app.get(SlackExceptionInterceptor));
  } else {
    interceptors.push(app.get(SentryExceptionInterceptor));
  }
  app.useGlobalInterceptors(...interceptors);
}

async function bootstrap() {
  const logger = new Logger('main');
  logger.log(`Starting app with '${environment.core.nodeEnv()}' environment`);
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  registerMiddlewares(app);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
