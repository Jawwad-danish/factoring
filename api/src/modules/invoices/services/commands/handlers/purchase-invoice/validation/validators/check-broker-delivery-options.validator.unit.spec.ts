import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { buildStubTagDefinition } from '@module-tag-definitions/test';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckBrokerDeliveryOptionsValidator } from './check-broker-delivery-options.validator';
import { CheckClientStatus } from './check-client-status.validator';

describe('CheckBrokerDeliveryOptionsValidator', () => {
  let validator: CheckClientStatus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckBrokerDeliveryOptionsValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(CheckBrokerDeliveryOptionsValidator);
  });

  it('Throws error when no delivery options available', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: buildStubBroker({
          tags: [],
        }),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error if one delivery option is available', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: buildStubBroker({
          tags: [
            buildStubTagDefinition(
              TagDefinitionKey.BROKER_REQUIRE_ONLINE_SUBMIT,
            ),
          ],
        }),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves.not.toThrow();
  });
});
