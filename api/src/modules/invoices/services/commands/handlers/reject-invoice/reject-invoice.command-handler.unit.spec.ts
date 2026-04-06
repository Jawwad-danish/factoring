import { ChangeActions } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { QueryRunner } from '@module-cqrs';
import { RejectInvoiceRequestBuilder } from '@module-invoices/test';
import { InvoiceEntity, InvoiceRepository } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { RejectInvoiceCommand } from '../../reject-invoice.command';
import { InvoiceAssigner } from '../common';
import { RejectInvoiceCommandHandler } from './reject-invoice.command-handler';
import { RejectInvoiceRuleService } from './rules';
import { EntityStubs } from '@module-persistence/test';

describe('Reject invoice command handler', () => {
  const queryRunner = createMock<QueryRunner>();
  const ruleService = createMock<RejectInvoiceRuleService>();
  const repository = createMock<InvoiceRepository>();
  const invoiceAssigner = createMock<InvoiceAssigner>();
  let handler: RejectInvoiceCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryRunner,
        RejectInvoiceCommandHandler,
        RejectInvoiceRuleService,
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
      .overrideProvider(InvoiceAssigner)
      .useValue(invoiceAssigner)
      .overrideProvider(RejectInvoiceRuleService)
      .useValue(ruleService)
      .overrideProvider(InvoiceRepository)
      .useValue(repository)
      .compile();

    handler = module.get(RejectInvoiceCommandHandler);
  });

  const mockQueryRunner = () => {
    queryRunner.run.mockResolvedValueOnce([
      buildStubClient(),
      buildStubBroker(),
    ]);
  };

  const mockInvoiceRepository = (invoiceEntity?: InvoiceEntity) => {
    const value = invoiceEntity || EntityStubs.buildStubInvoice();
    // loading of entity before reject operation
    repository.getOneById.mockResolvedValueOnce(value);
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

  it('Invoice assigner is called', async () => {
    mockQueryRunner();
    mockRuleService();
    mockInvoiceAssignerService();
    mockInvoiceRepository();

    await handler.execute(
      new RejectInvoiceCommand(
        UUID.get(),
        new RejectInvoiceRequestBuilder().getRequest(),
      ),
    );

    expect(invoiceAssigner.apply).toBeCalledTimes(1);
  });
});
