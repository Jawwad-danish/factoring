import { mockToken } from '@core/test';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { BrokerPaymentRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubUpdateBrokerPaymentRequest } from '../../../../test';
import { UpdateBrokerPaymentCommand } from '../../update-broker-payment.command';
import { UpdateBrokerPaymentRuleService } from './rules';
import { UpdateBrokerPaymentCommandHandler } from './update-broker-payment.command-handler';
import { UpdateBrokerPaymentValidationService } from './validation';

describe('UpdateBrokerPaymentCommandHandler', () => {
  let brokerPaymentRepository: BrokerPaymentRepository;
  let validationService: UpdateBrokerPaymentValidationService;
  let ruleService: UpdateBrokerPaymentRuleService;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: UpdateBrokerPaymentCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateBrokerPaymentCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    brokerPaymentRepository = module.get(BrokerPaymentRepository);
    validationService = module.get(UpdateBrokerPaymentValidationService);
    ruleService = module.get(UpdateBrokerPaymentRuleService);
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    handler = module.get(UpdateBrokerPaymentCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should validate', async () => {
    jest
      .spyOn(brokerPaymentRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubBrokerPayment());

    await handler.execute(
      new UpdateBrokerPaymentCommand('', buildStubUpdateBrokerPaymentRequest()),
    );

    expect(validationService.validate).toBeCalledTimes(1);
  });

  it('should apply rules', async () => {
    jest
      .spyOn(brokerPaymentRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubBrokerPayment());

    await handler.execute(
      new UpdateBrokerPaymentCommand('', buildStubUpdateBrokerPaymentRequest()),
    );

    expect(ruleService.execute).toBeCalledTimes(1);
    expect(invoiceChangeActionsExecutor.apply).toBeCalledTimes(1);
  });
});
