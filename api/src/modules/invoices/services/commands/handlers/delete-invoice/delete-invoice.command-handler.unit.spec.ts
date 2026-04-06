import { ChangeActor, ChangeOperation } from '@common';
import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { DeleteInvoiceRequestBuilder } from '@module-invoices/test';
import {
  InvoiceEntity,
  InvoiceRepository,
  RecordStatus,
  TagDefinitionKey,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { DeleteInvoiceCommand } from '../../delete-invoice.command';
import { DeleteInvoiceCommandHandler } from './delete-invoice.command-handler';
import { EntityStubs } from '@module-persistence/test';

describe('Delete invoice command handler', () => {
  const repository = createMock<InvoiceRepository>();
  const invoiceChangeActionsExecutor =
    createMock<InvoiceChangeActionsExecutor>();
  let handler: DeleteInvoiceCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteInvoiceCommandHandler,
        InvoiceRepository,
        InvoiceChangeActionsExecutor,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(InvoiceRepository)
      .useValue(repository)
      .overrideProvider(InvoiceChangeActionsExecutor)
      .useValue(invoiceChangeActionsExecutor)
      .compile();

    handler = module.get(DeleteInvoiceCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockRepository = (entity?: InvoiceEntity) => {
    repository.getOneById.mockResolvedValueOnce(
      entity ?? EntityStubs.buildStubInvoice(),
    );
  };

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Invoice is tagged and marked as inactive', async () => {
    const entity = EntityStubs.buildStubInvoice();
    mockRepository(entity);
    await handler.execute(
      new DeleteInvoiceCommand(UUID.get(), DeleteInvoiceRequestBuilder.from()),
    );

    expect(entity.recordStatus).toBe(RecordStatus.Inactive);
    const applyArguments = jest.spyOn(invoiceChangeActionsExecutor, 'apply')
      .mock.calls[0];
    expect(applyArguments[0]).toBeInstanceOf(InvoiceEntity);
    expect(applyArguments[1].actions[0].key).toBe(
      TagDefinitionKey.DELETE_INVOICE,
    );
    expect(applyArguments[1].actions[0].properties.operation).toBe(
      ChangeOperation.Assign,
    );
    expect(applyArguments[1].actions[0].properties.actor).toBe(
      ChangeActor.User,
    );
  });
});
