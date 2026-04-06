import { mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@core/validation';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { TagDefinitionKey, TagDefinitionRepository } from '@module-persistence';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../../test';
import { NonPaymentReasonValidator } from './non-payment-reason.validator';
import Big from 'big.js';
import { EntityStubs } from '@module-persistence/test';

describe('Check valid tag when creates a nonpayment', () => {
  let validator: NonPaymentReasonValidator;
  let tagDefinitionRepository: TagDefinitionRepository;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NonPaymentReasonValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(NonPaymentReasonValidator);
    tagDefinitionRepository = module.get(TagDefinitionRepository);
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
  });

  it('When add for nonpayment a valid tag, validation passes', async () => {
    const payload = buildStubCreateBrokerPaymentRequest({ amount: Big(0) });
    payload.tag = {
      key: TagDefinitionKey.BROKER_PAID_PREVIOUS_FACTOR,
      note: 'Broker paid previous factor',
    };
    jest.spyOn(tagDefinitionRepository, 'getByKey').mockResolvedValue(
      EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.BROKER_PAID_PREVIOUS_FACTOR,
      }),
    );
    jest
      .spyOn(invoiceChangeActionsExecutor, 'areTagsAssociatedWithGroups')
      .mockResolvedValue(true);
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice(),
        request: payload,
      }),
    ).resolves.not.toThrow();
  });

  it('When tag for nonpayment is not valid, validation throws error', async () => {
    jest.spyOn(tagDefinitionRepository, 'getByKey').mockResolvedValue(
      EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.BROKER_PAYMENT_OVERPAY,
      }),
    );
    expect(
      validator.validate({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice: EntityStubs.buildStubInvoice(),
        request: buildStubCreateBrokerPaymentRequest({
          amount: Big(0),
          tag: {
            key: TagDefinitionKey.BROKER_PAYMENT_OVERPAY,
            note: 'Broker paid previous factor',
          },
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
