import { mockToken } from '@core/test';
import { SESService } from '@module-aws';
import { FeatureFlagResolver } from '@module-common';
import { EmailRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import SESTransport from 'nodemailer/lib/ses-transport';
import { EmailService } from '.';

describe('EmailService', () => {
  let emailService: EmailService;
  let sesService: SESService;
  let featureFlagResolver: FeatureFlagResolver;
  let emailRepository: EmailRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    emailService = module.get(EmailService);
    sesService = module.get(SESService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    emailRepository = module.get(EmailRepository);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  it('should not send email if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(false);
    const result = await emailService.send({
      destination: { to: 'test@example.com' },
      message: { subject: 'test', body: 'test' },
    });
    expect(result).toBeNull();
    expect(emailRepository.persist).not.toHaveBeenCalled();
    expect(sesService.send).not.toHaveBeenCalled();
  });

  it('should send email and persist when conditions are met', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    jest.spyOn(sesService, 'send').mockResolvedValueOnce({
      messageId: 'test',
    } as SESTransport.SentMessageInfo);
    const result = await emailService.send({
      destination: { to: 'test@example.com' },
      message: { subject: 'test', body: 'test' },
    });
    expect(result).not.toBeNull();
    expect(emailRepository.persist).toBeCalledTimes(1);
    expect(sesService.send).toBeCalledTimes(1);
  });
});
