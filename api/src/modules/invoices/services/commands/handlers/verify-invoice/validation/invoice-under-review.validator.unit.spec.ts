import { ValidationError } from '@core/validation';
import { VerifyInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { InvoiceUnderReviewValidator } from './invoice-under-review.validator';
import { VerifyInvoiceValidator } from './verify-invoice-validator';

describe('Invoice under reivew validator', () => {
  let validator: VerifyInvoiceValidator;

  beforeEach(async () => {
    validator = new InvoiceUnderReviewValidator();
  });

  it('Invoice not under review gets rejected', async () => {
    const payload = new VerifyInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
    });

    expect(
      validator.validate({
        entity: entity,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: payload,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Invoice under review does not get rejected', async () => {
    const payload = new VerifyInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.UnderReview,
    });

    expect(
      validator.validate({
        entity: entity,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: payload,
      }),
    ).resolves.not.toThrow(ValidationError);
  });
});
