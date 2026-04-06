import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { Config, CONFIG_SERVICE, ConfigService } from '@module-config';
import { EmailService } from '@module-email';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailReportNotifier } from './email.report-notifier';

describe('EmailReportNotifier', () => {
  let emailReportNotifier: EmailReportNotifier;
  const emailService = createMock<EmailService>();
  const configService = createMock<ConfigService>();
  const originMock = new Config('NO_REPLY_EMAIL_ORIGIN', 'mock-origin');
  const bucketMock = new Config('EMAIL_TEMPLATES_BUCKET', 'mock-bucket');
  const ccMock = new Config('EMAIL_CC', ['mock-cc']);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailReportNotifier,
        {
          provide: CONFIG_SERVICE,
          useValue: configService,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    configService.getValue.mockImplementation((key) => {
      switch (key) {
        case 'NO_REPLY_EMAIL_ORIGIN':
          return originMock;
        case 'EMAIL_TEMPLATES_BUCKET':
          return bucketMock;
        case 'EMAIL_CC':
          return ccMock;
        default:
          throw new Error(`Unknown config key: ${key}`);
      }
    });

    emailReportNotifier = module.get(EmailReportNotifier);
  });

  it('should be defined', () => {
    expect(emailReportNotifier).toBeDefined();
  });

  it('should send email notification successfully', async () => {
    const payload = {
      reportName: 'Test Report',
      storageUrl: 'https://example.com/report',
      recipientEmail: 'test@example.com',
    };

    await emailReportNotifier.notify(payload);

    expect(emailService.sendTemplate).toHaveBeenCalledWith({
      from: originMock.asString(),
      destination: {
        to: 'test@example.com',
        cc: ccMock.asParsedJson(),
        bcc: [],
      },
      message: {
        subject: 'Your Bobtail Report is Ready: Test Report',
        s3: {
          bucket: bucketMock.asString(),
          key: 'reportReadyEmail.hbs',
        },
        placeholders: {
          reportName: 'Test Report',
          reportUrl: 'https://example.com/report',
        },
      },
    });
  });
});
