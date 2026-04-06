import { ValidationError } from '@core/validation';
import { buildStubUpdateInvoiceRequest } from '@module-invoices/test';
import { buildStubClient } from '@module-clients/test';
import { ClientPaymentStatus } from '@module-persistence/entities';
import { TransferTypeUpdateValidator } from './transfer-type-update.validator';
import { UpdateInvoiceValidator } from './update-invoice-validator';
import { EntityStubs } from '@module-persistence/test';

describe('Transfer type update validator', () => {
  let validator: UpdateInvoiceValidator;

  beforeEach(async () => {
    validator = new TransferTypeUpdateValidator();
  });

  it('When no payment type is provided, this validation rule passes', async () => {
    const payload = buildStubUpdateInvoiceRequest();
    delete payload.expedited;

    await validator.validate({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: null,
      payload: payload,
    });
  });

  it('Paid invoice with ACH payment gets validated for WIRE payment change', async () => {
    const payload = buildStubUpdateInvoiceRequest({
      expedited: false,
    });
    const entity = EntityStubs.buildStubInvoice({
      clientPaymentStatus: ClientPaymentStatus.Sent,
      expedited: true,
    });

    expect(
      validator.validate({
        entity: entity,
        client: buildStubClient(),
        broker: null,
        payload: payload,
      }),
    ).rejects.toThrow(ValidationError);
  });
});
