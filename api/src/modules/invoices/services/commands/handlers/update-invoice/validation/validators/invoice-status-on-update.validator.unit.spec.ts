import { ValidationError } from '@core/validation';
import { buildStubClient } from '@module-clients/test';
import { UpdateInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { InvoiceStatusOnUpdateValidator } from './invoice-status-on-update.validator';

describe('InvoiceStatusToRejectedValidator', () => {
  let validator: InvoiceStatusOnUpdateValidator;

  beforeEach(async () => {
    validator = new InvoiceStatusOnUpdateValidator();
  });

  it('Validator does not throw error for invoices that are not rejected', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.UnderReview,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new UpdateInvoiceRequest(),
      }),
    ).resolves;
  });

  it('Validator throws error for rejected invoices', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Rejected,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new UpdateInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
