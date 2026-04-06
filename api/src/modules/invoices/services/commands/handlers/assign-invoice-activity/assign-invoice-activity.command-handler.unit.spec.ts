import { mockMikroORMProvider, mockToken } from '@core/test';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  AssignInvoiceTagRequestBuilder,
  buildStubInvoiceTaggedContext,
} from '@module-invoices/test';
import { InvoiceEntity, TagDefinitionKey } from '@module-persistence/entities';
import {
  InvoiceRepository,
  TagDefinitionRepository,
} from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { AssignInvoiceActivityCommand } from '../../assign-tag-invoice.command';
import { AssignInvoiceActivityCommandHandler } from './assign-invoice-activity.command-handler';
import { AssignInvoiceActivityRuleService } from './rules';
import { createMock } from '@golevelup/ts-jest';
import { ChangeActions, ChangeOperation } from '@common';
import { AssignInvoiceActivityRequest } from '@module-invoices/data';

describe('AssignInvoiceTagCommandHandler', () => {
  let invoiceRepository: InvoiceRepository;
  let tagRepository: TagDefinitionRepository;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: AssignInvoiceActivityCommandHandler;
  const ruleService = createMock<AssignInvoiceActivityRuleService>();

  const mockDefaults = (key: TagDefinitionKey, invoice: InvoiceEntity) => {
    jest.spyOn(tagRepository, 'getByKey').mockResolvedValueOnce(
      EntityStubs.buildStubTagDefinition({
        key,
      }),
    );
    jest.spyOn(invoiceRepository, 'getOneById').mockResolvedValueOnce(invoice);
    return invoice;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignInvoiceActivityCommandHandler,
        mockMikroORMProvider,
        AssignInvoiceActivityRuleService,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(AssignInvoiceActivityRuleService)
      .useValue(ruleService)
      .compile();

    tagRepository = module.get(TagDefinitionRepository);
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    invoiceRepository = module.get(InvoiceRepository);
    handler = module.get(AssignInvoiceActivityCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Tag changes are applied to the invoice', async () => {
    const stubInvoice = mockDefaults(
      TagDefinitionKey.OTHER_INVOICE_ISSUE,
      EntityStubs.buildStubInvoice(),
    );
    const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');

    ruleService.execute.mockResolvedValueOnce(ChangeActions.empty());

    await handler.execute(
      new AssignInvoiceActivityCommand(
        '',
        new AssignInvoiceTagRequestBuilder().getRequest(),
      ),
    );

    const applyParams = applySpy.mock.calls[0];
    expect(applySpy).toBeCalledTimes(1);
    expect(ruleService.execute).toBeCalledTimes(1);
    expect(applyParams[0].id).toBe(stubInvoice.id);
    expect(applyParams[1].isEmpty()).toBe(false);
  });

  it('Tag changes are applied to the invoice and scheduled broker payment rule is executed', async () => {
    const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');
    const brokerPaymentScheduledTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
    });

    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(brokerPaymentScheduledTag)],
    });
    const stubInvoice = mockDefaults(
      TagDefinitionKey.LOAD_NOT_DELIVERED,
      invoice,
    );

    const context = buildStubInvoiceTaggedContext({
      invoice,
      request: new AssignInvoiceActivityRequest({
        key: TagDefinitionKey.LOAD_NOT_DELIVERED,
        note: 'any note',
      }),
    });

    ruleService.execute.mockResolvedValueOnce(
      ChangeActions.deleteTag(TagDefinitionKey.BROKER_PAYMENT_SCHEDULED),
    );

    const response = await handler.execute(
      new AssignInvoiceActivityCommand(invoice.id, context.request),
    );

    const applyParams = applySpy.mock.calls[0];
    expect(applySpy).toBeCalledTimes(1);
    expect(ruleService.execute).toBeCalledTimes(1);
    expect(applyParams[0].id).toBe(stubInvoice.id);
    expect(applyParams[1].isEmpty()).toBe(false);
    expect(response).toBeDefined();
    expect(response.changeActions.actions.length).toEqual(2);
    expect(response.changeActions.actions.map((a) => a.key)).toEqual([
      TagDefinitionKey.LOAD_NOT_DELIVERED,
      TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
    ]);
    expect(
      response.changeActions.actions.map((a) => a.input.properties.operation),
    ).toEqual([ChangeOperation.Assign, ChangeOperation.Delete]);
  });
});
