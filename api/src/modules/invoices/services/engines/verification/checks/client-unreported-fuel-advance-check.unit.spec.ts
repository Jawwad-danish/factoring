import { mockMikroORMProvider, mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { ClientTagRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientUnreportedFuelAdvanceCheck } from './client-unreported-fuel-advance-check';

describe('ClientUnreportedFuelAdvanceCheck', () => {
  let check: ClientUnreportedFuelAdvanceCheck;
  let clientTagRepository: ClientTagRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, ClientUnreportedFuelAdvanceCheck],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    check = module.get(ClientUnreportedFuelAdvanceCheck);
    clientTagRepository = module.get(ClientTagRepository);
  });

  it('Should be defined', () => {
    expect(check).toBeDefined();
  });

  it('Should return null when client does not have the unreported fuel advance tag', async () => {
    jest
      .spyOn(clientTagRepository, 'findByClientId')
      .mockResolvedValue([EntityStubs.buildStubClientTag()]);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).toBe(null);
  });

  it('Should return payload when client has the unreported fuel advance tag', async () => {
    jest
      .spyOn(clientTagRepository, 'findByClientId')
      .mockResolvedValue([
        EntityStubs.buildStubClientTag(
          TagDefinitionKey.UNREPORTED_FUEL_ADVANCE,
        ),
      ]);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).not.toBeNull();
    expect(result?.note).not.toBeNull();
    expect(result?.payload).not.toBeNull();
    expect(result?.payload?.cause).toBe('UnreportedFuelAdvance');
  });
});
