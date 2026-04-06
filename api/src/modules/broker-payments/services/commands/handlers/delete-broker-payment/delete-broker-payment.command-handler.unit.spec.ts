import { mockMikroORMProvider, mockToken } from '@core/test';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { RecordStatus } from '@module-persistence/entities';
import { BrokerPaymentRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubDeleteBrokerPaymentRequest } from '../../../../test';
import { DeleteBrokerPaymentCommand } from '../../delete-broker-payment.command';
import { DeleteBrokerPaymentCommandHandler } from './delete-broker-payment.command-handler';
import { DeleteBrokerPaymentRuleService } from './rules';
import { DeleteBrokerPaymentValidationService } from './validation';

describe('DeleteBrokerPaymentCommandHandler', () => {
  let brokerPaymentRepository: BrokerPaymentRepository;
  let validationService: DeleteBrokerPaymentValidationService;
  let ruleService: DeleteBrokerPaymentRuleService;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: DeleteBrokerPaymentCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, DeleteBrokerPaymentCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    brokerPaymentRepository = module.get(BrokerPaymentRepository);
    validationService = module.get(DeleteBrokerPaymentValidationService);
    ruleService = module.get(DeleteBrokerPaymentRuleService);
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    handler = module.get(DeleteBrokerPaymentCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should validate', async () => {
    jest
      .spyOn(brokerPaymentRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubBrokerPayment());
    const brokerPayment = await handler.execute(
      new DeleteBrokerPaymentCommand('', buildStubDeleteBrokerPaymentRequest()),
    );

    expect(brokerPayment.recordStatus).toBe(RecordStatus.Inactive);
    expect(validationService.validate).toBeCalledTimes(1);
  });

  it('should apply rules', async () => {
    jest
      .spyOn(brokerPaymentRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubBrokerPayment());

    const brokerPayment = await handler.execute(
      new DeleteBrokerPaymentCommand('', buildStubDeleteBrokerPaymentRequest()),
    );

    expect(brokerPayment.recordStatus).toBe(RecordStatus.Inactive);
    expect(ruleService.execute).toBeCalledTimes(1);
    expect(invoiceChangeActionsExecutor.apply).toBeCalledTimes(1);
  });
});
