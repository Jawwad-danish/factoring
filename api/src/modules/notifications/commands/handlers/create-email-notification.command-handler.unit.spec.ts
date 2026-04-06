import { mockToken } from '@core/test';
import { NotificationStatus } from '@module-persistence/entities';
import { NotificationRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import SESTransport from 'nodemailer/lib/ses-transport';
import { CreateEmailNotificationCommand } from '../create-email-notification.command';
import { CreateEmailNotificationCommandHandler } from './create-email-notification.command-handler';

describe('CreateEmailNotificationCommandHandler', () => {
  let notificationRepository: NotificationRepository;
  let handler: CreateEmailNotificationCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateEmailNotificationCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    notificationRepository = module.get(NotificationRepository);
    handler = module.get(CreateEmailNotificationCommandHandler);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it(`should set notification to ${NotificationStatus.FAILED} if the email sending action does not return a valid response`, async () => {
    const result = await handler.execute(
      new CreateEmailNotificationCommand('', () => Promise.resolve(null)),
    );
    expect(result.status).toBe(NotificationStatus.FAILED);
  });

  it(`should set notification to ${NotificationStatus.SENT} if the email sending action returns a valid response`, async () => {
    const result = await handler.execute(
      new CreateEmailNotificationCommand('', () =>
        Promise.resolve({
          mailingServiceResponse: {} as SESTransport.SentMessageInfo,
          destination: { to: [''] },
          message: { subject: '', body: '' },
        }),
      ),
    );
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(notificationRepository.persist).toHaveBeenCalledTimes(1);
  });

  it(`should set notification to ${NotificationStatus.FAILED} if the email sending action throws an error`, async () => {
    const result = await handler.execute(
      new CreateEmailNotificationCommand('', () =>
        Promise.reject(new Error('')),
      ),
    );
    expect(result.status).toBe(NotificationStatus.FAILED);
  });
});
