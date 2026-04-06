import { mockMikroORMProvider, mockToken } from '@core/test';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubCreateBrokerPaymentRequest } from '../../../../test';
import { CreateBrokerPaymentCommand } from '../../create-broker-payment.command';
import { CreateBrokerPaymentCommandHandler } from './create-broker-payment.command-handler';
import { CreateBrokerPaymentRuleService } from './rules';
import { CreateBrokerPaymentValidationService } from './validation';

describe('CreateBrokerPaymentCommandHandler', () => {
  let invoiceRepository: InvoiceRepository;
  let validationService: CreateBrokerPaymentValidationService;
  let ruleService: CreateBrokerPaymentRuleService;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: CreateBrokerPaymentCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, CreateBrokerPaymentCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    invoiceRepository = module.get(InvoiceRepository);
    validationService = module.get(CreateBrokerPaymentValidationService);
    ruleService = module.get(CreateBrokerPaymentRuleService);
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    handler = module.get(CreateBrokerPaymentCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should validate', async () => {
    jest
      .spyOn(invoiceRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubInvoice());
    await handler.execute(
      new CreateBrokerPaymentCommand(buildStubCreateBrokerPaymentRequest()),
    );

    expect(validationService.validate).toBeCalledTimes(1);
  });

  it('should apply rules', async () => {
    jest
      .spyOn(invoiceRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubInvoice());

    await handler.execute(
      new CreateBrokerPaymentCommand(buildStubCreateBrokerPaymentRequest()),
    );

    expect(ruleService.execute).toBeCalledTimes(1);
    expect(invoiceChangeActionsExecutor.apply).toBeCalledTimes(1);
  });
});
