import { buildStubBroker } from '@module-brokers/test';
import { ValidationError } from '@core/validation';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { InvoiceStatusToPurchasedValidator } from './invoice-status-to-purchased.validator';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';

describe('Invoice status to purchased', () => {
  let validator: PurchaseInvoiceValidator;

  beforeEach(async () => {
    validator = new InvoiceStatusToPurchasedValidator();
  });

  it('Validator does not throw error for [under_review -> purchased] status with broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.UnderReview,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).resolves;
  });

  it('Validator throws error for [under_review -> purchased] status without broker ', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.UnderReview,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Validator throws error for [rejected -> purchased] status without broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Rejected,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Validator throws error for [rejected -> purchased] status with broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Rejected,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Validator throws error for [purchased -> purchased] status without broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Validator throws error for [purchased -> purchased] status with broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
