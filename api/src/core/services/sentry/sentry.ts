import { environment } from '@core/environment';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { INestApplication } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { extraErrorDataIntegration } from '@sentry/node';

export const configureSentry = (app: INestApplication) => {
  const sampleRate = environment.isProduction() ? 1.0 : 0.1;
  const adapter = app.getHttpAdapter();
  const configService = app.get<ConfigService>(CONFIG_SERVICE);
  const enableSentry = configService.getValue('ENABLE_SENTRY');
  if (enableSentry.asBoolean() === false) return;

  const dsn = configService.getValue('SENTRY_DSN');
  Sentry.init({
    environment: environment.core.nodeEnv(),
    dsn: dsn.asString(),
    tracesSampleRate: 0.1,
    sampleRate: sampleRate,
    sendDefaultPii: false,
    normalizeDepth: 8,
    integrations: [
      Sentry.httpIntegration({ breadcrumbs: true }),
      Sentry.requestDataIntegration(),
      Sentry.expressIntegration(),
      Sentry.postgresIntegration(),
      extraErrorDataIntegration({ depth: 7 }),
    ],
  });
  Sentry.setupExpressErrorHandler(adapter.getInstance());
};
