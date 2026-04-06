import { mockMikroORMProvider, mockToken } from '@core/test';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubCreateBrokerPaymentRequest } from '../../../../test';
import { CreateBrokerPaymentCommand } from '../../create-broker-payment.command';
import { NonFactoredPaymentCommandHandler } from './non-factored-payment.command-handler';
import { NonFactoredPaymentPaymentRuleService } from './rules';
import { NonFactoredPaymentValidationService } from './validation';

describe('CreateBrokerPaymentCommandHandler', () => {
  let invoiceRepository: InvoiceRepository;
  let validationService: NonFactoredPaymentValidationService;
  let ruleService: NonFactoredPaymentPaymentRuleService;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: NonFactoredPaymentCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, NonFactoredPaymentCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    invoiceRepository = module.get(InvoiceRepository);
    validationService = module.get(NonFactoredPaymentValidationService);
    ruleService = module.get(NonFactoredPaymentPaymentRuleService);
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    handler = module.get(NonFactoredPaymentCommandHandler);
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
