import { ReportName } from '@module-persistence';
import { TemplateLoader } from './template-loader';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject } from '@nestjs/common';
import { S3Service } from '@module-aws';
import { S3ObjectLocator } from '@module-aws';
import { Logger } from '@nestjs/common';
import { ReportsRegistry } from '../reports.registry';

export class CloudTemplateLoader implements TemplateLoader {
  private readonly logger = new Logger(CloudTemplateLoader.name);
  private s3Bucket: string;
  private publicResourcesBucket: string;

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    this.s3Bucket = this.configService
      .getValue('REPORT_TEMPLATES_BUCKET')
      .asString();
    this.publicResourcesBucket = this.configService
      .getValue('PUBLIC_RESOURCES_BUCKET')
      .asString();
  }

  async getTemplate(reportName: ReportName): Promise<string> {
    const metadata = ReportsRegistry.get(reportName);
    const key = metadata.template || 'basic-report.hbs';
    const locator = new S3ObjectLocator(this.s3Bucket, key);
    this.logger.debug(`Fetching template from: ${locator.toString()}`);
    return this.s3Service.getObjectContent(locator);
  }

  async getPublicResourcesBucket(): Promise<string> {
    return `https://${this.publicResourcesBucket}.s3.us-east-1.amazonaws.com`;
  }
}
