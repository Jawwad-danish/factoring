import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientOnHoldCheck } from './client-on-hold-check';

describe('ClientOnHoldCheck', () => {
  let check: ClientOnHoldCheck;
  let clientFactoringConfigsRepository: ClientFactoringConfigsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientOnHoldCheck],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    check = module.get(ClientOnHoldCheck);
    clientFactoringConfigsRepository = module.get(
      ClientFactoringConfigsRepository,
    );
  });

  it('Should be defined', () => {
    expect(check).toBeDefined();
  });

  it('Should return null when no client factoring config is found', async () => {
    jest
      .spyOn(clientFactoringConfigsRepository, 'findOneByClientId')
      .mockResolvedValue(null);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).toBe(null);
  });

  it('Should return null when no client factoring status is Active', async () => {
    jest
      .spyOn(clientFactoringConfigsRepository, 'findOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({
          status: ClientFactoringStatus.Active,
        }),
      );

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).toBe(null);
  });

  it('Should return payload when client factoring status is on hold', async () => {
    jest
      .spyOn(clientFactoringConfigsRepository, 'findOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({
          status: ClientFactoringStatus.Hold,
        }),
      );

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });

    expect(result).not.toBeNull();
    expect(result?.note).not.toBeNull();
    expect(result?.payload).not.toBeNull();
    expect(result?.payload?.cause).toBe('ClientStatus');
  });
});
