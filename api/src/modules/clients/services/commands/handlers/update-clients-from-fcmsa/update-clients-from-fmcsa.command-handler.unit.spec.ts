import { mockMikroORMProvider, mockToken } from '@core/test';
import { UUID } from '@core/util';
import { AuthorityState, InsuranceStatus } from '@module-clients';
import { buildStubLightweightClient } from '@module-clients/test';
import {
  ClientFactoringStatus,
  ClientStatusReason,
} from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateClientsFromFmcsaCommand } from '../../update-clients-from-fmcsa.command';
import { UpdateClientsFromFmcsaCommandHandler } from './update-clients-from-fmcsa.command-handler';

const buildStubStatusHistory = (
  status = ClientFactoringStatus.Hold,
  reason = ClientStatusReason.FMCSAIssues,
  note = 'FMCSA issue: Per FMCSA site NOT AUTHORIZED',
) => {
  return EntityStubs.buildClientStatusReasonAssocEntity({
    note,
    clientStatusReasonConfig: EntityStubs.buildClientStatusReasonConfigEntity({
      status,
      reason,
    }),
  });
};

describe('UpdateClientsFromFmcsaCommandHandler', () => {
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;
  let handler: UpdateClientsFromFmcsaCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, UpdateClientsFromFmcsaCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientFactoringConfigRepository = module.get(
      ClientFactoringConfigsRepository,
    );
    handler = module.get(UpdateClientsFromFmcsaCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should not update status if config is not present in the client api response', async () => {
    const initialConfigStatus = ClientFactoringStatus.Active;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: UUID.get(),
      status: initialConfigStatus,
      statusHistory: [buildStubStatusHistory()],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);

    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({ id: UUID.get(), allowedToOperate: 'N' }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(initialConfigStatus);
  });

  it(`should not update status if config is ${ClientFactoringStatus.Released}`, async () => {
    const clientId = UUID.get();
    const initialConfigStatus = ClientFactoringStatus.Released;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId,
      status: ClientFactoringStatus.Released,
      statusHistory: [buildStubStatusHistory()],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);

    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({ id: clientId, allowedToOperate: 'N' }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(initialConfigStatus);
  });

  it(`should not update status if config is ${ClientFactoringStatus.Hold} and not FMCSA related`, async () => {
    const clientId = UUID.get();
    const initialConfigStatus = ClientFactoringStatus.Hold;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId,
      status: initialConfigStatus,
      statusHistory: [
        buildStubStatusHistory(
          initialConfigStatus,
          ClientStatusReason.InvoiceIssues,
        ),
      ],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);

    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({ id: clientId, allowedToOperate: 'Y' }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(initialConfigStatus);
  });

  it(`should not update status if config is ${ClientFactoringStatus.Hold} and not set by FMCSA sync process but ${ClientStatusReason.FMCSAIssues} is the reason`, async () => {
    const clientId = UUID.get();
    const initialConfigStatus = ClientFactoringStatus.Hold;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId,
      status: initialConfigStatus,
      statusHistory: [
        buildStubStatusHistory(
          initialConfigStatus,
          ClientStatusReason.FMCSAIssues,
          'John Doe: FMCSA issue detected on another website',
        ),
      ],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);

    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({ id: clientId, allowedToOperate: 'Y' }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(initialConfigStatus);
  });

  it(`should update status if config is ${ClientFactoringStatus.Active} and FMCSA will be ${ClientFactoringStatus.Hold}`, async () => {
    const clientId = UUID.get();
    const initialConfigStatus = ClientFactoringStatus.Active;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId,
      status: ClientFactoringStatus.Active,
      statusHistory: [
        buildStubStatusHistory(
          initialConfigStatus,
          ClientStatusReason.Other,
          'Active',
        ),
      ],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);

    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({
          id: clientId,
          authorityStatus: AuthorityState.Inactive,
          allowedToOperate: 'N',
        }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(ClientFactoringStatus.Hold);
    expect(clientFactoringConfig.statusHistory.length).toBe(2);
    expect(clientFactoringConfig.statusHistory.getItems()[1].note).toBe(
      'FMCSA issue: Per FMCSA site NOT AUTHORIZED',
    );
    expect(
      clientFactoringConfig.statusHistory.getItems()[1].clientStatusReasonConfig
        .reason,
    ).toBe(ClientStatusReason.FMCSAIssues);
    expect(
      clientFactoringConfig.statusHistory.getItems()[1].clientStatusReasonConfig
        .status,
    ).toBe(ClientFactoringStatus.Hold);
  });

  it(`should update status if config is ${ClientFactoringStatus.Hold} by FMCSA sync process and FMCSA result will be ${ClientFactoringStatus.Active}`, async () => {
    const clientId = UUID.get();
    const initialConfigStatus = ClientFactoringStatus.Hold;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId,
      status: initialConfigStatus,
      statusHistory: [
        buildStubStatusHistory(
          ClientFactoringStatus.Active,
          ClientStatusReason.Other,
          'Active',
        ),
        buildStubStatusHistory(),
      ],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);
    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({
          id: clientId,
          authorityStatus: AuthorityState.Active,
          allowedToOperate: 'Y',
        }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(ClientFactoringStatus.Active);
    expect(clientFactoringConfig.statusHistory.length).toBe(3);
    expect(clientFactoringConfig.statusHistory.getItems()[2].note).toBe(
      'Per FMCSA carrier is Authorized',
    );
    expect(
      clientFactoringConfig.statusHistory.getItems()[2].clientStatusReasonConfig
        .reason,
    ).toBe(ClientStatusReason.Other);
    expect(
      clientFactoringConfig.statusHistory.getItems()[2].clientStatusReasonConfig
        .status,
    ).toBe(ClientFactoringStatus.Active);
  });

  it(`should not add another status histry entry if the statuses are the same`, async () => {
    const clientId = UUID.get();
    const initialConfigStatus = ClientFactoringStatus.Active;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId,
      status: initialConfigStatus,
      statusHistory: [
        buildStubStatusHistory(
          initialConfigStatus,
          ClientStatusReason.Other,
          'Active',
        ),
      ],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);

    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({
          id: clientId,
          authorityStatus: AuthorityState.Active,
        }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(initialConfigStatus);
    expect(clientFactoringConfig.statusHistory.length).toBe(1);
  });

  it(`should update to ${ClientFactoringStatus.Hold} if FMCSA common authority status is ${AuthorityState.Active} and allowed to operate is 'N' and the client is ${ClientFactoringStatus.Active}`, async () => {
    const clientId = UUID.get();
    const initialConfigStatus = ClientFactoringStatus.Active;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId,
      status: initialConfigStatus,
      statusHistory: [
        buildStubStatusHistory(
          ClientFactoringStatus.Active,
          ClientStatusReason.Other,
          'Active',
        ),
      ],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);

    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({
          id: clientId,
          authorityStatus: AuthorityState.Active,
          insuranceStatus: InsuranceStatus.Active,
          allowedToOperate: 'N',
        }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(ClientFactoringStatus.Hold);
    expect(clientFactoringConfig.statusHistory.length).toBe(2);
    expect(clientFactoringConfig.statusHistory.getItems()[1].note).toBe(
      'FMCSA issue: Per FMCSA site NOT AUTHORIZED',
    );
    expect(
      clientFactoringConfig.statusHistory.getItems()[1].clientStatusReasonConfig
        .reason,
    ).toBe(ClientStatusReason.FMCSAIssues);
  });

  it(`should not update to ${ClientFactoringStatus.Active} if FMCSA common authority status is ${AuthorityState.Active} and allowed to operate is 'N' and the client is ${ClientFactoringStatus.Hold} for other reasons`, async () => {
    const clientId = UUID.get();
    const initialConfigStatus = ClientFactoringStatus.Hold;
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId,
      status: initialConfigStatus,
      statusHistory: [
        buildStubStatusHistory(
          ClientFactoringStatus.Hold,
          ClientStatusReason.Other,
          '',
        ),
      ],
    });
    jest
      .spyOn(clientFactoringConfigRepository, 'find')
      .mockResolvedValueOnce([clientFactoringConfig]);

    await handler.execute(
      new UpdateClientsFromFmcsaCommand([
        buildStubLightweightClient({
          id: clientId,
          authorityStatus: AuthorityState.Active,
          insuranceStatus: InsuranceStatus.Active,
          allowedToOperate: 'N',
        }),
      ]),
    );
    expect(clientFactoringConfig.status).toBe(ClientFactoringStatus.Hold);
    expect(clientFactoringConfig.statusHistory.length).toBe(1);
  });
});
