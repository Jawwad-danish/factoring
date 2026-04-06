import { ChangeOperation } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubUpdateInvoiceRequest } from '@module-invoices/test';
import {
  InvoiceTagEntity,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateInvoiceBrokerNotFoundActivityRule } from './broker-not-found-activity-rule';
import { EntityStubs } from '@module-persistence/test';

describe('FindBrokerRule', () => {
  let rule: UpdateInvoiceBrokerNotFoundActivityRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        UpdateInvoiceBrokerNotFoundActivityRule,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(UpdateInvoiceBrokerNotFoundActivityRule);
  }, 60000);

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('If broker found, no activity', async () => {
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubUpdateInvoiceRequest(),
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('If broker not found, returns tag activity', async () => {
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubUpdateInvoiceRequest({
        brokerId: null,
      }),
    });

    expect(result.actions[0].key).toBe(TagDefinitionKey.BROKER_NOT_FOUND);
    expect(result.actions[0].noteDetails).not.toBeNull();
  });

  it('If broker found, and invoice is tagged, prepare for removal', async () => {
    const stubInvoiceTagEntity = new InvoiceTagEntity();
    stubInvoiceTagEntity.tagDefinition = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_NOT_FOUND,
    });

    const invoice = EntityStubs.buildStubInvoice({
      tags: [stubInvoiceTagEntity],
    });

    const result = await rule.run({
      entity: invoice,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubUpdateInvoiceRequest(),
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.actions[0].key).toBe(TagDefinitionKey.BROKER_NOT_FOUND);
    expect(result.actions[0].properties.operation).toBe(ChangeOperation.Delete);
  });
});
