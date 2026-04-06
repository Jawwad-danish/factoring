import { mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { buildStubTagDefinition } from '@module-tag-definitions/test';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDeliveryOptionsRule } from './missing-delivery-options-rule';
import { EntityStubs } from '@module-persistence/test';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';

describe('Missing Delivery Options Rule', () => {
  let missingDeliveryOptionsRule: MissingDeliveryOptionsRule<CreateInvoiceRequest>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MissingDeliveryOptionsRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    missingDeliveryOptionsRule = module.get(MissingDeliveryOptionsRule);
  }, 60000);

  it('MissingDeliveryOptionsRule should be defined', () => {
    expect(missingDeliveryOptionsRule).toBeDefined();
  });

  it('If broker has missing delivery options tag, returns no activity to an invoice', async () => {
    const result = await missingDeliveryOptionsRule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker({
        tags: [
          buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_COPIES),
          buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_EMAIL),
          buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_FAX),
          buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_ONLINE_SUBMIT),
          buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_ORIGINALS),
        ],
      }),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions[0]).toBeUndefined();
  });

  it('If broker has missing delivery options tag, returns tag activity to an invoice', async () => {
    const result = await missingDeliveryOptionsRule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker({
        tags: [],
      }),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions[0].key).toBe(
      TagDefinitionKey.BROKER_INFORMATION_MISSING,
    );
    expect(result.actions[0].noteDetails).not.toBeNull();
  });
});
