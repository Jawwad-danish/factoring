import { mockMikroORMProvider, mockToken } from '@core/test';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateClientsFromInactivityCommandHandler } from './update-clients-from-inactivity.command-handler';

describe('UpdateClientsFromInactivityCommandHandler', () => {
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;
  let handler: UpdateClientsFromInactivityCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        UpdateClientsFromInactivityCommandHandler,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientFactoringConfigRepository = module.get(
      ClientFactoringConfigsRepository,
    );
    handler = module.get(UpdateClientsFromInactivityCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it(`should update client config statuses to ${ClientFactoringStatus.Hold} for inactive clients`, async () => {
    const inactiveClientConfigs = [
      EntityStubs.buildClientFactoringConfig({
        status: ClientFactoringStatus.Active,
      }),
      EntityStubs.buildClientFactoringConfig({
        status: ClientFactoringStatus.Active,
      }),
    ];

    jest
      .spyOn(
        clientFactoringConfigRepository,
        'get90DaysInactiveClientFactoringConfigs',
      )
      .mockResolvedValue(inactiveClientConfigs);

    const result = await handler.execute();

    expect(result.changes).toHaveLength(2);
    for (const change of result.changes) {
      expect(change.updatedStatus).toBe(ClientFactoringStatus.Hold);
    }
  });

  it('should return an empty array if no inactive client configs are found', async () => {
    jest
      .spyOn(
        clientFactoringConfigRepository,
        'get90DaysInactiveClientFactoringConfigs',
      )
      .mockResolvedValue([]);
    const result = await handler.execute();
    expect(result.changes).toHaveLength(0);
  });
});
