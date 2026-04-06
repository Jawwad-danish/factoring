import { ChangeActor, ChangeOperation } from '@common';
import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { buildStubDeleteInvoiceTagRequest } from '@module-invoices/test';
import { InvoiceEntity, InvoiceRepository } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { DeleteInvoiceActivityCommand } from '../../delete-invoice-activity.command';
import { DeleteInvoiceActivityCommandHandler } from './delete-invoice-activity.command-handler';
import { DeleteInvoiceTagValidationService } from './validation';
import { EntityStubs } from '@module-persistence/test';

describe('DeleteInvoiceActivityCommandHandler', () => {
  const repository = createMock<InvoiceRepository>();
  const invoiceChangeActionsExecutor =
    createMock<InvoiceChangeActionsExecutor>();
  const validationService = createMock<DeleteInvoiceTagValidationService>();
  let handler: DeleteInvoiceActivityCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteInvoiceActivityCommandHandler,
        InvoiceRepository,
        InvoiceChangeActionsExecutor,
        DeleteInvoiceTagValidationService,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(InvoiceRepository)
      .useValue(repository)
      .overrideProvider(InvoiceChangeActionsExecutor)
      .useValue(invoiceChangeActionsExecutor)
      .overrideProvider(DeleteInvoiceTagValidationService)
      .useValue(validationService)
      .compile();

    handler = module.get(DeleteInvoiceActivityCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockRepository = () => {
    repository.getOneById.mockResolvedValueOnce(EntityStubs.buildStubInvoice());
  };

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Validation passes, deletion tag is applied', async () => {
    const activityId = UUID.get();
    mockRepository();
    await handler.execute(
      new DeleteInvoiceActivityCommand(
        UUID.get(),
        activityId,
        buildStubDeleteInvoiceTagRequest(),
      ),
    );

    const applyArguments = jest.spyOn(invoiceChangeActionsExecutor, 'apply')
      .mock.calls[0];
    expect(applyArguments[0]).toBeInstanceOf(InvoiceEntity);
    expect(applyArguments[1].actions[0].activityId).toBe(activityId);
    expect(applyArguments[1].actions[0].properties.operation).toBe(
      ChangeOperation.Delete,
    );
    expect(applyArguments[1].actions[0].properties.actor).toBe(
      ChangeActor.User,
    );
  });
});
