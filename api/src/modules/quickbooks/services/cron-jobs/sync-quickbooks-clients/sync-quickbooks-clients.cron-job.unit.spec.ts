import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { FeatureFlagResolver } from '@module-common';
import { Config, CONFIG_SERVICE, ConfigService } from '@module-config';
import { CronJobType } from '@module-cron/data';
import { WorkerJobType } from '@module-persistence';
import { JobService } from '@module-worker';
import { Test, TestingModule } from '@nestjs/testing';
import { SyncQuickbooksClientsCronJob } from './sync-quickbooks-clients.cron-job';

describe('SyncQuickbooksClientsCronJob', () => {
  let cronJob: SyncQuickbooksClientsCronJob;
  const jobService = createMock<JobService>();
  const configService = createMock<ConfigService>({
    getValue: jest
      .fn()
      .mockReturnValue(
        new Config('SYNC_QUICKBOOKS_CLIENTS_CRON', '*/5 * * * *'),
      ),
  });
  const featureFlagResolver = createMock<FeatureFlagResolver>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncQuickbooksClientsCronJob,
        { provide: JobService, useValue: jobService },
        { provide: CONFIG_SERVICE, useValue: configService },
        { provide: FeatureFlagResolver, useValue: featureFlagResolver },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    cronJob = module.get(SyncQuickbooksClientsCronJob);
    jest.clearAllMocks();
    featureFlagResolver.isEnabled.mockReturnValue(true);
  });

  it('should be defined', () => {
    expect(cronJob).toBeDefined();
  });

  it('should dispatch SyncQuickbooksClientsCommand onTick', async () => {
    await cronJob.execute();

    expect(jobService.enqueue).toHaveBeenCalledWith({
      type: WorkerJobType.Cron,
      payload: {
        jobType: CronJobType.SyncQuickbooksClients,
      },
    });
  });

  it('should not dispatch job when feature flag is disabled', async () => {
    featureFlagResolver.isEnabled.mockReturnValue(false);

    await cronJob.execute();

    expect(jobService.enqueue).not.toHaveBeenCalled();
  });
});
