import { buildStubBroker } from '@module-brokers/test';
import { ValidationError } from '@core/validation';
import { RejectInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { InvoiceStatusToRejectedValidator } from './invoice-status-to-rejected.validator';
import { RejectInvoiceValidator } from './reject-invoice-validator';

describe('Invoice status to rejected', () => {
  let validator: RejectInvoiceValidator;

  beforeEach(async () => {
    validator = new InvoiceStatusToRejectedValidator();
  });

  it('Validator does not throw error for [under_review -> rejected] status without broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.UnderReview,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new RejectInvoiceRequest(),
      }),
    ).resolves;
  });

  it('Validator does not throw error for [under_review -> rejected] status with broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.UnderReview,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new RejectInvoiceRequest(),
      }),
    ).resolves;
  });

  it('Validator throws error for [purchased -> rejected] status without broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new RejectInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Validator throws error for [purchased -> rejected] status with broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new RejectInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Validator throws error for [rejected -> rejected] status', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Rejected,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new RejectInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
