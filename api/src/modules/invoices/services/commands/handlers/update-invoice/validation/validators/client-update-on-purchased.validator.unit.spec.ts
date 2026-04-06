import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { UpdateInvoiceRequest } from '@module-invoices/data';
import { buildStubUpdateInvoiceRequest } from '@module-invoices/test';
import { buildStubClient } from '@module-clients/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientUpdateOnPurchasedValidator } from './client-update-on-purchased.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Client update on purchase validator', () => {
  let validator: ClientUpdateOnPurchasedValidator<UpdateInvoiceRequest>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientUpdateOnPurchasedValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ClientUpdateOnPurchasedValidator);
  });

  it('When try to modify a client id for an purchased invoice', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
        }),
        client: buildStubClient(),
        broker: null,
        payload: buildStubUpdateInvoiceRequest({
          clientId: '757ba6b5-4bff-405f-92a0-322085b96378',
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('When try to modify a client id for an invoice which is not yet purchased', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.UnderReview,
        }),
        client: buildStubClient(),
        broker: null,
        payload: buildStubUpdateInvoiceRequest({
          clientId: '757ba6b5-4bff-405f-92a0-322085b96378',
        }),
      }),
    ).resolves.not.toThrow();
  });
});
