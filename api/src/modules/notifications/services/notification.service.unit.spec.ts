import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { CommandRunner } from '@module-cqrs';
import { EntityStubs } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '.';

describe('NotificationsService', () => {
  let notificationService: NotificationsService;
  let featureFlagResolver: FeatureFlagResolver;
  let commandRunner: CommandRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    notificationService = module.get(NotificationsService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    commandRunner = module.get(CommandRunner);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(notificationService).toBeDefined();
  });

  it('should not send notifications if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(false);
    const result = await notificationService.createEmailNotification(
      buildStubClient(),
      () => Promise.resolve(null),
    );
    expect(result).toBeNull();
    expect(commandRunner.run).not.toHaveBeenCalled();
  });

  it('should send notifications if feature flag is enabled', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    jest
      .spyOn(commandRunner, 'run')
      .mockResolvedValueOnce(EntityStubs.buildStubNotification());
    const result = await notificationService.createEmailNotification(
      buildStubClient(),
      () => Promise.resolve(null),
    );
    expect(result).not.toBeNull();
    expect(commandRunner.run).toHaveBeenCalledTimes(1);
  });
});
