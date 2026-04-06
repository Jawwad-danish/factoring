import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { ReportName } from '@module-persistence';
import { Inject, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { ReportsRegistry } from '../reports.registry';
import { TemplateLoader } from './template-loader';

export class LocalTemplateLoader implements TemplateLoader {
  private readonly logger = new Logger(LocalTemplateLoader.name);
  private localTemplatesPath: string;

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {
    this.localTemplatesPath = this.configService
      .getValue('LOCAL_TEMPLATES_PATH')
      .asString();
  }

  async getTemplate(reportName: ReportName): Promise<string> {
    const metadata = ReportsRegistry.get(reportName);
    const fileName = metadata.template;
    if (!fileName) {
      throw new Error(`Template not found for report ${reportName}`);
    }
    const path = `${this.localTemplatesPath}/${fileName}`;
    this.logger.debug(`Fetching template from: ${path}`);
    return fs.readFileSync(path, 'utf-8');
  }

  async getPublicResourcesBucket(): Promise<string> {
    return this.configService
      .getValue('EXTERNAL_LOCAL_RESOURCES_URL')
      .asString();
  }
}
