import { ChangeActions } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { InvoiceContext } from '@module-invoices/data';
import { QueryRunner, RequestCommand } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceEntity, InvoiceRepository } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseInvoiceCommandHandler } from './base-invoice.command-handler';
import { InvoiceRuleService, InvoiceValidationService } from './common';

@Injectable()
class BasicInvoiceRuleService extends InvoiceRuleService<any> {
  constructor() {
    super([]);
  }
}
class BasicInvoiceValidationService extends InvoiceValidationService<any> {
  constructor() {
    super([]);
  }
}

class BaseInvoiceCommand extends RequestCommand<any, InvoiceContext> {
  constructor(request: any) {
    super(request);
  }
}
@Injectable()
class BasicInvoiceCommandHandler extends BaseInvoiceCommandHandler<
  any,
  BaseInvoiceCommand
> {
  constructor(
    readonly queryRunner: QueryRunner,
    readonly invoiceRepository: InvoiceRepository,
    readonly validationService: BasicInvoiceValidationService,
    readonly ruleService: BasicInvoiceRuleService,
    readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {
    super(
      queryRunner,
      invoiceRepository,
      validationService,
      ruleService,
      invoiceChangeActionsExecutor,
    );
  }
  protected async loadEntity(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: BaseInvoiceCommand,
  ): Promise<InvoiceEntity> {
    return EntityStubs.buildStubInvoice();
  }
}

describe('Base invoice command handler', () => {
  const queryRunner = createMock<QueryRunner>();
  const validationService = createMock<BasicInvoiceValidationService>();
  const ruleService = createMock<BasicInvoiceRuleService>();
  const invoiceTagActivityManager = createMock<InvoiceChangeActionsExecutor>();
  let handler: BasicInvoiceCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryRunner,
        BasicInvoiceCommandHandler,
        BasicInvoiceRuleService,
        BasicInvoiceValidationService,
        InvoiceChangeActionsExecutor,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })

      .overrideProvider(QueryRunner)
      .useValue(queryRunner)
      .overrideProvider(BasicInvoiceValidationService)
      .useValue(validationService)
      .overrideProvider(BasicInvoiceRuleService)
      .useValue(ruleService)
      .overrideProvider(InvoiceChangeActionsExecutor)
      .useValue(invoiceTagActivityManager)
      .compile();

    handler = module.get(BasicInvoiceCommandHandler);
  });

  const mockQueryRunner = () => {
    queryRunner.run.mockResolvedValueOnce([
      buildStubClient(),
      buildStubBroker(),
    ]);
  };

  const mockRuleService = () => {
    ruleService.execute.mockResolvedValueOnce(ChangeActions.empty());
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Validation is called', async () => {
    mockQueryRunner();
    mockRuleService();

    await handler.execute(new BaseInvoiceCommand({}));

    expect(validationService.validate).toBeCalledTimes(1);
  });

  it('Rules are called', async () => {
    mockQueryRunner();

    await handler.execute(new BaseInvoiceCommand({}));
    expect(ruleService.execute).toBeCalledTimes(1);
  });

  it('Tags are applied', async () => {
    mockQueryRunner();
    mockRuleService();

    await handler.execute(new BaseInvoiceCommand({}));

    expect(invoiceTagActivityManager.apply).toBeCalledTimes(1);
  });
});
