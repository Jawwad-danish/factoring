import { BrokerPaymentScheduledRule } from './broker-payment-scheduled-rule';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '@core/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { buildStubInvoiceTaggedContext } from '@module-invoices/test';
import { AssignInvoiceActivityRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { mockMikroORMProvider } from '@core/test';
import { ChangeActions, ChangeOperation } from '@common';
import { TagResolutionService } from '../../../../tag-resolution.service';

describe('BrokerPaymentScheduledRule', () => {
  let rule: BrokerPaymentScheduledRule;
  let tagResolutionService: TagResolutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrokerPaymentScheduledRule,
        TagResolutionService,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(BrokerPaymentScheduledRule);
    tagResolutionService = module.get(TagResolutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('When invoice has no tags, returns empty change actions', async () => {
    const invoice = EntityStubs.buildStubInvoice();

    const context = buildStubInvoiceTaggedContext({
      invoice,
      request: new AssignInvoiceActivityRequest({}),
    });

    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(ChangeActions.empty());
    const result = await rule.run(context);
    expect(result.isEmpty()).toBe(true);
    expect(tagResolutionService.run).not.toHaveBeenCalled();
  });

  it('When invoice has tags, should assign BROKER_PAYMENT_SCHEDULED tag and delete other tags', async () => {
    const incorrectRateTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.INCORRECT_RATE_ADDED,
    });
    const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.LOAD_NOT_DELIVERED,
    });
    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(incorrectRateTag),
        EntityStubs.buildStubInvoiceTag(loadNotDeliveredTag),
      ],
    });
    const context = buildStubInvoiceTaggedContext({
      invoice,
      request: new AssignInvoiceActivityRequest({
        key: TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
        note: 'any note',
        payload: {
          talked_to: 'me',
          issue_date: '2025-09-07T11:42:00.000Z',
          check_number_or_ach: '2221',
          talked_to_contact_method: 'phone',
        },
      }),
    });

    const mockChangeActions = ChangeActions.deleteTag(
      TagDefinitionKey.INCORRECT_RATE_ADDED,
    ).concat(ChangeActions.deleteTag(TagDefinitionKey.LOAD_NOT_DELIVERED));
    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(mockChangeActions);

    const result = await rule.run(context);
    expect(result.actions.length).toEqual(2);
    expect(result.actions.map((a) => a.key)).toEqual([
      TagDefinitionKey.INCORRECT_RATE_ADDED,
      TagDefinitionKey.LOAD_NOT_DELIVERED,
    ]);
    expect(result.actions.map((a) => a.input.properties.operation)).toEqual([
      ChangeOperation.Delete,
      ChangeOperation.Delete,
    ]);
  });

  it('When invoice has tags, should assign BROKER_PAYMENT_SCHEDULED tag and not delete internal flags', async () => {
    const clientLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
    });
    const brokerLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
    });
    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(clientLimitTag),
        EntityStubs.buildStubInvoiceTag(brokerLimitTag),
      ],
    });
    const context = buildStubInvoiceTaggedContext({
      invoice,
      request: new AssignInvoiceActivityRequest({
        key: TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
        note: 'any note',
        payload: {
          talked_to: 'me',
          issue_date: '2025-09-07T11:42:00.000Z',
          check_number_or_ach: '2221',
          talked_to_contact_method: 'phone',
        },
      }),
    });

    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(ChangeActions.empty());

    const result = await rule.run(context);
    expect(result.actions.length).toEqual(0);
  });

  it('When invoice has tag BROKER_PAYMENT_SCHEDULED, tag with an error flag and delete the actual BROKER_PAYMENT_SCHEDULED', async () => {
    const brokerPaymentScheduledTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
    });
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(brokerPaymentScheduledTag)],
    });
    const context = buildStubInvoiceTaggedContext({
      invoice,
      request: new AssignInvoiceActivityRequest({
        key: TagDefinitionKey.LOAD_NOT_DELIVERED,
        note: 'any note',
        payload: {
          talked_to: 'me',
          issue_date: '2025-09-07T11:42:00.000Z',
          check_number_or_ach: '2221',
          talked_to_contact_method: 'phone',
        },
      }),
    });

    const mockChangeActions = ChangeActions.deleteTag(
      TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
    );
    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(mockChangeActions);

    const result = await rule.run(context);
    expect(result.actions.length).toEqual(1);
    expect(result.actions.map((a) => a.key)).toEqual([
      TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
    ]);
    expect(result.actions.map((a) => a.input.properties.operation)).toEqual([
      ChangeOperation.Delete,
    ]);
  });
});
