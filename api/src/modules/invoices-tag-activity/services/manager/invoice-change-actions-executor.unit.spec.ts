import { ChangeActions } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { ChangeActionAssignOperationHandler } from './change-action-assign-operation-handler';
import { ChangeActionDeleteOperationHandler } from './change-action-delete-operation-handler';
import { InvoiceChangeActionsExecutor } from './invoice-change-actions-executor';

describe('InvoiceTagActivityManager', () => {
  let manager: InvoiceChangeActionsExecutor;
  let assignOperationHandler: ChangeActionAssignOperationHandler;
  let deleteOperationHandler: ChangeActionDeleteOperationHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, InvoiceChangeActionsExecutor],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    manager = module.get(InvoiceChangeActionsExecutor);
    assignOperationHandler = module.get(ChangeActionAssignOperationHandler);
    deleteOperationHandler = module.get(ChangeActionDeleteOperationHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(manager).toBeDefined();
  });

  it('When change operation is assign, assign handler is called', async () => {
    expect(manager).toBeDefined();

    await manager.apply(
      EntityStubs.buildStubInvoice(),
      ChangeActions.addTag(TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES),
    );

    expect(jest.spyOn(assignOperationHandler, 'handle')).toBeCalledTimes(1);
  });

  it('When change operation is delete, delete handler is called', async () => {
    expect(manager).toBeDefined();

    await manager.apply(
      EntityStubs.buildStubInvoice(),
      ChangeActions.deleteTag(TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES),
    );

    expect(jest.spyOn(deleteOperationHandler, 'handle')).toBeCalledTimes(1);
  });
});
