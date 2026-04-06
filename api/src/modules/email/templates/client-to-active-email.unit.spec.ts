import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../services';
import { ClientToActiveEmail } from './client-to-active-email';

describe('ClientToActiveEmail', () => {
  let clientToActiveEmail: ClientToActiveEmail;
  let emailService: EmailService;
  let featureFlagResolver: FeatureFlagResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientToActiveEmail],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    emailService = module.get(EmailService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    clientToActiveEmail = module.get(ClientToActiveEmail);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(clientToActiveEmail).toBeDefined();
  });

  it('should not send email if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(true);
    const client = buildStubClient();
    await clientToActiveEmail.send(client);
    expect(emailService.sendTemplate).toHaveBeenCalledTimes(0);
  });

  it('should send email when all conditions are met', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    await clientToActiveEmail.send(client);
    expect(emailService.sendTemplate).toHaveBeenCalledTimes(1);
  });
});
