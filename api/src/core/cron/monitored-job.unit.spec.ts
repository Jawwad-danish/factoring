import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';

import { DatabaseService } from '@module-database';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { MonitoredJob } from './monitored-job';

jest.mock('cron', () => {
  return {
    CronJob: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
    })),
  };
});

@Injectable()
class MonitoredJobImplementationMock extends MonitoredJob {
  async execute(): Promise<void> {
    return;
  }
  constructor(
    schedulerRegistry: SchedulerRegistry,
    databaseService: DatabaseService,
  ) {
    super(schedulerRegistry, databaseService);
  }
}

describe('Monitored Job', () => {
  const schedulerRegistry = createMock<SchedulerRegistry>();
  let monitoredJob: MonitoredJobImplementationMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerRegistry,
        MonitoredJobImplementationMock,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })

      .overrideProvider(SchedulerRegistry)
      .useValue(schedulerRegistry)
      .compile();

    monitoredJob = module.get(MonitoredJobImplementationMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(monitoredJob).toBeDefined();
  });

  it('Job is registered properly', async () => {
    monitoredJob.registerJob('Job Cena', '* * * * *');
    expect(schedulerRegistry.addCronJob).toBeCalled();
  });

  it('Job is overwritten if already registered', async () => {
    schedulerRegistry.doesExist.mockReturnValueOnce(true);
    monitoredJob.registerJob('Job Cena', '* * * * *');
    expect(schedulerRegistry.deleteCronJob).toBeCalled();
    expect(schedulerRegistry.addCronJob).toBeCalled();
  });
});
