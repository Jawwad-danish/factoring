jest.mock('cron', () => ({
  CronJob: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

import { createMock } from '@golevelup/ts-jest';
import { TransferTimeService } from '@module-common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { CronJobType } from '@module-cron/data';
import { DatabaseService } from '@module-database';
import { WorkerJobType } from '@module-persistence';
import { JobService } from '@module-worker';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import dayjs from 'dayjs';
import { ScheduledRegularCronJob } from './scheduled-regular.cron-job';

describe('ScheduledRegularCronJob', () => {
  let service: ScheduledRegularCronJob;
  const configService = createMock<ConfigService>();
  const schedulerRegistry = createMock<SchedulerRegistry>();
  const databaseService = createMock<DatabaseService>();
  const transferTimeService = createMock<TransferTimeService>();
  const jobService = createMock<JobService>();

  transferTimeService.findAllTransferTimes.mockReturnValue([
    {
      name: 'first_ach',
      send: { hour: 13, minute: 0 },
      cutoff: { hour: 12, minute: 30 },
    },
    {
      name: 'second_ach',
      send: { hour: 22, minute: 0 },
      cutoff: { hour: 21, minute: 30 },
    },
  ]);

  transferTimeService.getTransferTimeInBusinessTimezone.mockImplementation(
    (transferTime) => ({
      send: dayjs()
        .hour(transferTime.send.hour)
        .minute(transferTime.send.minute),
      cutoff: dayjs()
        .hour(transferTime.cutoff.hour)
        .minute(transferTime.cutoff.minute),
    }),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledRegularCronJob,
        { provide: CONFIG_SERVICE, useValue: configService },
        { provide: SchedulerRegistry, useValue: schedulerRegistry },
        { provide: DatabaseService, useValue: databaseService },
        { provide: TransferTimeService, useValue: transferTimeService },
        { provide: JobService, useValue: jobService },
      ],
    }).compile();

    service = module.get(ScheduledRegularCronJob);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register cron jobs for all transfer times', () => {
    expect(schedulerRegistry.addCronJob).toHaveBeenCalledTimes(2);
    expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
      'SCHEDULED_REGULAR_TRANSFER_FIRST_ACH',
      expect.any(Object),
    );
    expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
      'SCHEDULED_REGULAR_TRANSFER_SECOND_ACH',
      expect.any(Object),
    );
  });

  it('should enqueue job when triggered', async () => {
    await service.execute();
    expect(jobService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WorkerJobType.Cron,
        payload: {
          jobType: CronJobType.ScheduledRegularTransfer,
        },
      }),
    );
  });
});
