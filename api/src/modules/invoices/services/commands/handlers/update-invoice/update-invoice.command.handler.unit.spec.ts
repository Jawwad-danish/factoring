import { ChangeActions } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { QueryRunner } from '@module-cqrs';
import { DocumentsProcessor } from '@module-invoices';
import { buildStubUpdateInvoiceRequest } from '@module-invoices/test';
import {
  ClientPaymentStatus,
  InvoiceEntity,
  InvoiceRepository,
  InvoiceStatus,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { UpdateInvoiceCommand } from '../../update-invoice.command';
import { InvoiceAssigner } from '../common';
import { UpdateInvoiceRuleService } from './rules';
import { UpdateInvoiceCommandHandler } from './update-invoice.command.handler';
import { EntityStubs } from '@module-persistence/test';

describe('Update invoice command handler', () => {
  const queryRunner = createMock<QueryRunner>();
  const ruleService = createMock<UpdateInvoiceRuleService>();
  const repository = createMock<InvoiceRepository>();
  const documentProcessor = createMock<DocumentsProcessor>();
  const invoiceAssigner = createMock<InvoiceAssigner>();
  let handler: UpdateInvoiceCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryRunner,
        UpdateInvoiceCommandHandler,
        UpdateInvoiceRuleService,
        InvoiceRepository,
        InvoiceAssigner,
        DocumentsProcessor,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(QueryRunner)
      .useValue(queryRunner)
      .overrideProvider(UpdateInvoiceRuleService)
      .useValue(ruleService)
      .overrideProvider(InvoiceRepository)
      .useValue(repository)
      .overrideProvider(DocumentsProcessor)
      .useValue(documentProcessor)
      .overrideProvider(InvoiceAssigner)
      .useValue(invoiceAssigner)
      .compile();

    handler = module.get(UpdateInvoiceCommandHandler);
  });

  const mockQueryRunner = () => {
    queryRunner.run.mockResolvedValueOnce([
      buildStubClient(),
      buildStubBroker(),
    ]);
  };

  const mockInvoiceRepository = (invoiceEntity?: InvoiceEntity) => {
    const value = invoiceEntity || EntityStubs.buildStubInvoice();
    // loading of entity before update operation
    repository.getOneById.mockResolvedValueOnce(value);
    // updating the entity in the context after the update operation is done
    repository.persistAndFlush.mockResolvedValueOnce(value);
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

  it('Documents processor is called', async () => {
    mockQueryRunner();
    mockRuleService();
    mockInvoiceRepository();
    mockInvoiceAssignerService();

    await handler.execute(
      new UpdateInvoiceCommand(UUID.get(), buildStubUpdateInvoiceRequest()),
    );

    expect(documentProcessor.sendToProcess).toBeCalledTimes(1);
  });

  it('sendDocumentAfterProcessingFlag is sent accordingly', async () => {
    mockQueryRunner();
    mockRuleService();
    mockInvoiceAssignerService();

    const entity = EntityStubs.buildStubInvoice();
    entity.status = InvoiceStatus.Purchased;
    entity.clientPaymentStatus = ClientPaymentStatus.Sent;
    mockInvoiceRepository(entity);

    const payload = buildStubUpdateInvoiceRequest();
    payload.resendEmail = true;

    await handler.execute(new UpdateInvoiceCommand(UUID.get(), payload));

    expect(documentProcessor.sendToProcess).toBeCalledWith(
      expect.anything(),
      true,
    );
  });
});
