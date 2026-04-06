import { mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import {
  ClientFactoringStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { TagOnholdClientInvoiceRule } from './tag-onhold-client-invoice-rule';
import { EntityStubs } from '@module-persistence/test';

describe('TagOnholdClientInvoiceRule', () => {
  let rule: TagOnholdClientInvoiceRule;
  let clientFactoringConfigsRepository: ClientFactoringConfigsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagOnholdClientInvoiceRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(TagOnholdClientInvoiceRule);
    clientFactoringConfigsRepository =
      module.get<ClientFactoringConfigsRepository>(
        ClientFactoringConfigsRepository,
      );
  });

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('If client on hold tag definition is found and client fanctoring is HOLD, returns client on hold tag', async () => {
    jest
      .spyOn(clientFactoringConfigsRepository, 'findOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({
          status: ClientFactoringStatus.Hold,
        }),
      );
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice({
        lineHaulRate: new Big(1000),
      }),
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions[0].key).toBe(TagDefinitionKey.CLIENT_ON_HOLD);
    expect(result.actions[0].noteDetails).not.toBeNull();
  });
});
