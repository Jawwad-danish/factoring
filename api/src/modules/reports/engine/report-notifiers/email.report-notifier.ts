import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { EmailService } from '@module-email';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ReportNotifier, ReportNotifyPayload } from './base.report-notifier';

@Injectable()
export class EmailReportNotifier implements ReportNotifier {
  private readonly logger = new Logger(EmailReportNotifier.name);
  private readonly emailTemplatesBucket: string;
  private readonly emailOrigin: string;
  private readonly emailCC?: string[];

  constructor(
    private readonly emailService: EmailService,
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {
    const bucket = this.configService.getValue('EMAIL_TEMPLATES_BUCKET');
    if (!bucket.hasValue()) {
      throw new Error(`Could not obtain EMAIL_TEMPLATES_BUCKET config value`);
    }
    this.emailTemplatesBucket = bucket.asString();

    const origin = this.configService.getValue('NO_REPLY_EMAIL_ORIGIN');
    if (!origin.hasValue()) {
      throw new Error(`Could not obtain NO_REPLY_EMAIL_ORIGIN config value`);
    }
    this.emailOrigin = origin.asString();

    const cc = this.configService.getValue('EMAIL_CC');
    if (cc.hasValue()) {
      this.emailCC = cc.asParsedJson() as string[];
    }
  }

  async notify(payload: ReportNotifyPayload): Promise<void> {
    const { reportName, storageUrl, recipientEmail } = payload;

    try {
      const destination = {
        to: recipientEmail,
        cc: this.emailCC || [],
        bcc: [],
      };
      const message = {
        subject: `Your Bobtail Report is Ready: ${reportName}`,
        s3: {
          bucket: this.emailTemplatesBucket,
          key: 'reportReadyEmail.hbs',
        },
        placeholders: {
          reportName: reportName,
          reportUrl: storageUrl,
        },
      };

      this.logger.log(
        `Sending report ready notification for ${reportName} to ${recipientEmail}`,
      );
      await this.emailService.sendTemplate({
        from: this.emailOrigin,
        destination,
        message,
      });
      this.logger.log(
        `Successfully sent report ready notification for ${reportName} to ${recipientEmail}`,
      );
    } catch (emailError) {
      this.logger.error(
        `Failed to send report ready notification for ${reportName} to ${recipientEmail}: ${emailError.message}`,
        emailError.stack,
      );
    }
  }
}
