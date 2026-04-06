import { Provider } from '@nestjs/common';
import { REPORT_NOTIFIER, ReportNotifier } from './base.report-notifier';
import { EmailReportNotifier } from './email.report-notifier';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { EmailService } from '@module-email';
import { environment } from '@core/environment';
import { EmptyReportNotifier } from './empty.report-notifier';

export const reportNotifierProvider: Provider = {
  provide: REPORT_NOTIFIER,
  useFactory(
    configService: ConfigService,
    emailService: EmailService,
  ): ReportNotifier {
    if (environment.isLocal() || environment.isTest()) {
      return new EmptyReportNotifier();
    }
    return new EmailReportNotifier(emailService, configService);
  },
  inject: [CONFIG_SERVICE, EmailService],
};
