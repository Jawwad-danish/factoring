import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { ClientStatusReason } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../services';
import { ClientToOnHoldEmail } from './client-to-on-hold-email';

describe('ClientToOnHoldEmail', () => {
  let clientToOnHoldEmail: ClientToOnHoldEmail;
  let emailService: EmailService;
  let featureFlagResolver: FeatureFlagResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientToOnHoldEmail],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    emailService = module.get(EmailService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    clientToOnHoldEmail = module.get(ClientToOnHoldEmail);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(clientToOnHoldEmail).toBeDefined();
  });

  it('should not send email if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(true);
    const client = buildStubClient();
    await clientToOnHoldEmail.send({
      client,
      reason: ClientStatusReason.Other,
    });
    expect(emailService.sendTemplate).toHaveBeenCalledTimes(0);
  });

  it('should send email when all conditions are met', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    await clientToOnHoldEmail.send({
      client,
      reason: ClientStatusReason.Other,
    });
    expect(emailService.sendTemplate).toHaveBeenCalledTimes(1);
  });
});
