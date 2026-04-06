import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import {
  CommandInvoiceContext,
  RejectInvoiceRequest,
} from '@module-invoices/data';
import { TagDefinitionKey, TagDefinitionRepository } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { TagRejectedInvoiceRule } from './tag-rejected-invoice.rule';
import { EntityStubs } from '@module-persistence/test';

describe('TagRejectedInvoiceRule', () => {
  let rule: TagRejectedInvoiceRule;
  let tagDefinitionRepository: TagDefinitionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagRejectedInvoiceRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get<TagRejectedInvoiceRule>(TagRejectedInvoiceRule);
    tagDefinitionRepository = module.get(TagDefinitionRepository);
  }, 60000);

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Tag is applied if reason and note are present', async () => {
    jest.spyOn(tagDefinitionRepository, 'getByKey').mockResolvedValueOnce(
      EntityStubs.buildStubTagDefinition({
        name: `These aren't the droids you're looking for`,
      }),
    );
    const payload = new RejectInvoiceRequest();
    payload.key = TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT;
    payload.note = 'mokito';
    const entity = EntityStubs.buildStubInvoice();
    const client = buildStubClient();

    const context: CommandInvoiceContext<RejectInvoiceRequest> = {
      client: client,
      broker: null,
      entity: entity,
      payload: payload,
    };

    const result = await rule.run(context);
    expect(result.actions.length).toBe(1);
    expect(result.actions[0]?.key).toBe(payload.key);
    expect(result.actions[0].noteDetails?.getText()).toBe(
      `Declined because: These aren't the droids you're looking for. ${payload.note}`,
    );
  });

  it('Tag is applied if reason is present', async () => {
    jest
      .spyOn(tagDefinitionRepository, 'getByKey')
      .mockResolvedValueOnce(EntityStubs.buildStubTagDefinition());
    const payload = new RejectInvoiceRequest();
    payload.key = TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT;
    const entity = EntityStubs.buildStubInvoice();
    const client = buildStubClient();

    const context: CommandInvoiceContext<RejectInvoiceRequest> = {
      client: client,
      broker: null,
      entity: entity,
      payload: payload,
    };

    const result = await rule.run(context);
    expect(result.actions.length).toBe(1);
    expect(result.actions[0]?.key).toBe(payload.key);
    expect(result.actions[0].noteDetails?.getText()).toBeDefined();
  });
});
