import { ChangeActions } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import { createMock } from '@golevelup/ts-jest';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { QueryRunner } from '@module-cqrs';
import {
  InvoiceEntity,
  InvoiceRepository,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { RevertInvoiceCommand } from '../../revert-invoice.command';
import { InvoiceAssigner } from '../common';
import { RevertInvoiceCommandHandler } from './revert-invoice.command-handler';
import { RevertInvoiceRuleService } from './rules';

describe('Revert invoice command handler', () => {
  const queryRunner = createMock<QueryRunner>();
  const ruleService = createMock<RevertInvoiceRuleService>();
  const repository = createMock<InvoiceRepository>();
  const invoiceAssigner = createMock<InvoiceAssigner>();
  let handler: RevertInvoiceCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryRunner,
        RevertInvoiceCommandHandler,
        RevertInvoiceRuleService,
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
      .overrideProvider(RevertInvoiceRuleService)
      .useValue(ruleService)
      .overrideProvider(InvoiceRepository)
      .useValue(repository)
      .compile();

    handler = module.get(RevertInvoiceCommandHandler);
  });

  const mockQueryRunner = () => {
    queryRunner.run.mockResolvedValueOnce([
      buildStubClient(),
      buildStubBroker(),
    ]);
  };

  const mockInvoiceRepository = (invoiceEntity?: InvoiceEntity) => {
    const value = invoiceEntity || EntityStubs.buildStubInvoice();
    // loading of entity before revert operation
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

    await handler.execute(new RevertInvoiceCommand(UUID.get(), {}));

    expect(invoiceAssigner.apply).toBeCalledTimes(1);
  });

  it('Invoice is reverted - status is under review', async () => {
    mockQueryRunner();
    mockRuleService();
    mockInvoiceAssignerService();

    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
      purchasedDate: new Date(),
    });
    mockInvoiceRepository(entity);

    await handler.execute(new RevertInvoiceCommand(UUID.get(), {}));
    expect(invoiceAssigner.apply).toBeCalledWith(
      entity,
      expect.objectContaining({
        status: InvoiceStatus.UnderReview,
        purchasedDate: null,
      }),
      TagDefinitionKey.REVERT_INVOICE,
    );
  });
});
