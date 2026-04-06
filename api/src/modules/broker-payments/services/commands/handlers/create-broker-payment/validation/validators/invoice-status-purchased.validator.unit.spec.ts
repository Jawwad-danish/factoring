import { mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import { ValidationError } from '@core/validation';
import { InvoiceStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../../test';
import { InvoiceStatusPurchasedValidator } from './invoice-status-purchased.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Check existing invoice when creates a payment validator', () => {
  let validator: InvoiceStatusPurchasedValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceStatusPurchasedValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(InvoiceStatusPurchasedValidator);
  });

  it('When invoice status is purchased, validation passes', async () => {
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Purchased,
        }),
        request: buildStubCreateBrokerPaymentRequest(),
      }),
    ).resolves.not.toThrow();
  });

  it('When invoice status is other then purchased, validation throws error', async () => {
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice({
          status: InvoiceStatus.Rejected,
        }),
        request: buildStubCreateBrokerPaymentRequest({
          id: UUID.get(),
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
