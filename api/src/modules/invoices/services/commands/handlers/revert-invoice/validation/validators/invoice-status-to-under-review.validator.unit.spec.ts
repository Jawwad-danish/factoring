import { buildStubBroker } from '@module-brokers/test';
import { ValidationError } from '@core/validation';
import { RevertInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import {
  ClientPaymentStatus,
  InvoiceStatus,
} from '@module-persistence/entities';
import { InvoiceStatusToUnderReviewValidator } from './invoice-status-to-under-review.validator';
import { RevertInvoiceValidator } from './revert-invoice-validator';

describe('Invoice status to under review validator', () => {
  let validator: RevertInvoiceValidator;

  beforeEach(async () => {
    validator = new InvoiceStatusToUnderReviewValidator();
  });

  it('Validator does not throw error for [rejected -> under_review] status without broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Rejected,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new RevertInvoiceRequest(),
      }),
    ).resolves;
  });

  it('Validator does not throw error for [rejected -> under_review] status with broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Rejected,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new RevertInvoiceRequest(),
      }),
    ).resolves;
  });

  it('Validator does not throw error for [pruchased -> under_review] status without broker', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
        }),
        client: buildStubClient(),
        broker: null,
        payload: new RevertInvoiceRequest(),
      }),
    ).resolves;
  });

  it('Validator throws error for [purchased -> under_review] status with broker and SENT clientStatusPayment', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.Sent,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new RevertInvoiceRequest(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Validator does not throw error for [purchased -> under_review] status with broker and NOT_APPLICABLE clientStatusPayment', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
          clientPaymentStatus: ClientPaymentStatus.NotApplicable,
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new RevertInvoiceRequest(),
      }),
    ).resolves;
  });
});
