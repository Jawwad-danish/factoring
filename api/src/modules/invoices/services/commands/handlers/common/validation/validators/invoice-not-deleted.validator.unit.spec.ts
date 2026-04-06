import { ValidationError } from '@core/validation';
import { buildStubUpdateInvoiceRequest } from '@module-invoices/test';
import { buildStubClient } from '@module-clients/test';
import { RecordStatus } from '@module-persistence/entities';
import { InvoiceNotDeletedValidator } from './invoice-not-deleted.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Invoice not deleted validator', () => {
  let validator: InvoiceNotDeletedValidator<unknown>;

  beforeEach(async () => {
    validator = new InvoiceNotDeletedValidator();
  });

  it('Should not throw error if invoice is not deleted', async () => {
    await validator.validate({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: null,
      payload: buildStubUpdateInvoiceRequest(),
    });
  });

  it('Should throw error if the invoice is deleted', async () => {
    const payload = buildStubUpdateInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      recordStatus: RecordStatus.Inactive,
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
