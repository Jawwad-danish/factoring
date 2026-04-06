import { Provider } from '@nestjs/common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { S3Service } from '@module-aws';
import { ReportWriter } from './base.report-writer';
import { CloudReportWriter } from './cloud.report-writer';
import { LocalReportWriter } from './local.report-writer';
import { environment } from '@core/environment';

export const REPORT_WRITER = 'REPORT_WRITER';

export const reportWriterProvider: Provider<ReportWriter> = {
  provide: REPORT_WRITER,
  useFactory: (
    configService: ConfigService,
    s3Service: S3Service,
  ): ReportWriter => {
    if (environment.isLocal() || environment.isTest()) {
      const localReportsPath = configService.getValue('LOCAL_REPORTS_PATH');
      if (!localReportsPath.hasValue()) {
        throw new Error(`Could not obtain LOCAL_REPORTS_PATH config value`);
      }
      return new LocalReportWriter(localReportsPath.asString());
    }

    const reportsBucketName = configService.getValue('REPORTS_BUCKET');
    if (!reportsBucketName.hasValue()) {
      throw new Error(`Could not obtain REPORTS_BUCKET config value`);
    }
    return new CloudReportWriter(reportsBucketName.asString(), s3Service);
  },
  inject: [CONFIG_SERVICE, S3Service],
};
