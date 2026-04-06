import { mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import { ValidationError } from '@core/validation';
import { InvoiceStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../../test';
import { InvoiceStatusRejectedValidator } from './invoice-status-rejected.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Check existing invoice when creating a non payment validator', () => {
  let validator: InvoiceStatusRejectedValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceStatusRejectedValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(InvoiceStatusRejectedValidator);
  });

  it('When invoice status is rejected, validation passes', async () => {
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Rejected,
        }),
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).resolves.not.toThrow();
  });

  it('When invoice status is other then rejected, validation throws error', async () => {
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
        }),
        request: buildStubCreateBrokerPaymentRequest({
          id: UUID.get(),
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
