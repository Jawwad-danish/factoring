import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { buildStubClient } from '@module-clients/test';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckClientNoaValidator } from './check-client-noa.validator';

describe('CheckClientNoaValidator', () => {
  let validator: CheckClientNoaValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckClientNoaValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(CheckClientNoaValidator);
  });

  it('Throws error when client has no NOA documents', async () => {
    const client = buildStubClient();
    client.documents = [];

    await expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client,
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error when client has NOA documents', async () => {
    const client = buildStubClient();

    await expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client,
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves.not.toThrow();
  });
});
