import { mockMikroORMProvider, mockToken } from '@core/test';
import { PeruseRepository, PeruseStatus } from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { PeruseJobResult, PeruseJobStatus } from '../data';
import { PeruseClient } from './peruse-client';
import { PeruseService } from './peruse.service';

describe('PeruseService', () => {
  let peruseService: PeruseService;
  let peruseClient: PeruseClient;
  let peruseRepository: PeruseRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, PeruseService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    peruseService = module.get(PeruseService);
    peruseRepository = module.get(PeruseRepository);
    peruseClient = module.get(PeruseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(peruseService).toBeDefined();
    expect(peruseClient).toBeDefined();
    expect(peruseRepository).toBeDefined();
  });

  it('When no Peruse jobs are available for sync, it does not call Peruse', async () => {
    jest.spyOn(peruseRepository, 'find').mockResolvedValueOnce([]);

    await peruseService.sync();

    expect(jest.spyOn(peruseClient, 'getJob')).toBeCalledTimes(0);
  });

  it('When Peruse jobs are available for sync and Peruse status is successful', async () => {
    const entity = EntityStubs.buildStubPeruseJob({
      status: PeruseStatus.InProgress,
      response: null,
    });
    const response = new PeruseJobResult({
      jobId: entity.jobId,
      status: PeruseJobStatus.Success,
      raw: {},
    });
    jest.spyOn(peruseRepository, 'find').mockResolvedValue([entity]);
    jest.spyOn(peruseClient, 'getJob').mockResolvedValue(response);

    await peruseService.sync();

    expect(entity.status).toBe(PeruseStatus.Done);
    expect(entity.response).toStrictEqual(response.raw);
  });

  it('When Peruse jobs are available for sync and Peruse status is error', async () => {
    const entity = EntityStubs.buildStubPeruseJob({
      status: PeruseStatus.InProgress,
      response: null,
    });
    const response = new PeruseJobResult({
      jobId: entity.jobId,
      status: PeruseJobStatus.Error,
      raw: {},
    });
    jest.spyOn(peruseRepository, 'find').mockResolvedValue([entity]);
    jest.spyOn(peruseClient, 'getJob').mockResolvedValue(response);

    await peruseService.sync();

    expect(entity.status).toBe(PeruseStatus.Error);
    expect(entity.response).toStrictEqual(null);
  });
});
