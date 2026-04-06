import { ChangeActions } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { Broker } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { Client } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { QueryRunner } from '@module-cqrs';
import { PurchaseInvoiceRequestBuilder } from '@module-invoices/test';
import { InvoiceRepository } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { PurchaseInvoiceCommand } from '../../purchase-invoice.command';
import { InvoiceAssigner } from '../common';
import { PurchaseInvoiceCommandHandler } from './purchase-invoice.command-handler';
import { PurchaseInvoiceRuleService } from './rules';
import { EntityStubs } from '@module-persistence/test';

describe('Purchase invoice command handler', () => {
  const queryRunner = createMock<QueryRunner>();
  const ruleService = createMock<PurchaseInvoiceRuleService>();
  const repository = createMock<InvoiceRepository>();
  const invoiceAssigner = createMock<InvoiceAssigner>();
  let handler: PurchaseInvoiceCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryRunner,
        PurchaseInvoiceCommandHandler,
        PurchaseInvoiceRuleService,
        InvoiceRepository,
        InvoiceAssigner,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(QueryRunner)
      .useValue(queryRunner)
      .overrideProvider(PurchaseInvoiceRuleService)
      .useValue(ruleService)
      .overrideProvider(InvoiceRepository)
      .useValue(repository)
      .overrideProvider(InvoiceAssigner)
      .useValue(invoiceAssigner)
      .compile();

    handler = module.get(PurchaseInvoiceCommandHandler);
  });

  const mockQueryRunner = (value?: [Client, Broker | null]) => {
    const mockValue = value || [buildStubClient(), buildStubBroker()];
    queryRunner.run.mockResolvedValueOnce(mockValue);
  };

  const mockInvoiceRepository = () => {
    repository.getOneById.mockResolvedValueOnce(EntityStubs.buildStubInvoice());
  };

  const mockRuleService = () => {
    ruleService.execute.mockResolvedValueOnce(ChangeActions.empty());
  };

  const mockInvoiceAssignerService = (): void => {
    invoiceAssigner.apply.mockResolvedValueOnce(ChangeActions.empty());
  };
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('The invoice has been purchased', async () => {
    mockQueryRunner();
    mockRuleService();
    mockInvoiceRepository();
    mockInvoiceAssignerService();

    await handler.execute(
      new PurchaseInvoiceCommand(
        UUID.get(),
        new PurchaseInvoiceRequestBuilder().getRequest(),
      ),
    );

    expect(invoiceAssigner.apply).toBeCalledTimes(1);
  });
});
