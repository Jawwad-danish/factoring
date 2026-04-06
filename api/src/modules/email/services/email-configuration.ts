import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable } from '@nestjs/common';

export interface EmailConfig {
  origin: string;
  noticeOfAssignmentOrigin: string;
  templatesBucket: string;
}

@Injectable()
export class EmailConfiguration {
  private readonly config: EmailConfig;

  constructor(@Inject(CONFIG_SERVICE) readonly configService: ConfigService) {
    const emailOrigin = configService.getValue('BOBTAIL_EMAIL_ORIGIN');
    if (!emailOrigin.hasValue()) {
      throw new Error(`Could not obtain BOBTAIL_EMAIL_ORIGIN config value`);
    }

    const templatesBucket = configService.getValue('EMAIL_TEMPLATES_BUCKET');
    if (!templatesBucket.hasValue()) {
      throw new Error(`Could not obtain EMAIL_TEMPLATES_BUCKET config value`);
    }

    const noticeOfAssignmentOrigin = configService.getValue('NOA_EMAIL_ORIGIN');
    if (!noticeOfAssignmentOrigin.hasValue()) {
      throw new Error(`Could not obtain NOA_EMAIL_ORIGIN config value`);
    }

    this.config = {
      origin: emailOrigin.asString(),
      templatesBucket: templatesBucket.asString(),
      noticeOfAssignmentOrigin: noticeOfAssignmentOrigin.asString(),
    };
  }

  getOrigin(): string {
    return this.config.origin;
  }

  getTemplatesBucket(): string {
    return this.config.templatesBucket;
  }

  getNoticeOfAssignmentOrigin(): string {
    return this.config.noticeOfAssignmentOrigin;
  }
}
