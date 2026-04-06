import { mockMikroORMProvider, mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { InvoiceMapper, UpdateInvoiceRequest } from '@module-invoices/data';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import {
  ClientFactoringStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { TagDefinitionMapper } from '@module-tag-definitions';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientFactoringStatusRule } from './client-factoring-status-rule';
import { EntityStubs } from '@module-persistence/test';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';

describe('Tag client issue rule', () => {
  let tagClientIssueRule: ClientFactoringStatusRule<
    CreateInvoiceRequest | UpdateInvoiceRequest
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        ClientFactoringStatusRule,
        InvoiceMapper,
        TagDefinitionMapper,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    tagClientIssueRule = module.get(ClientFactoringStatusRule);
  }, 60000);

  it('TagClientIssuesRule should be defined', () => {
    expect(tagClientIssueRule).toBeDefined();
  });

  it('If client status in good standing, return empty tag', async () => {
    const result = await tagClientIssueRule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient({
        factoringConfig: { status: ClientFactoringStatus.Active },
      }),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions.length).toBe(0);
  });

  it('If client status not in good standing, return tag activity', async () => {
    const result = await tagClientIssueRule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient({
        factoringConfig: { status: ClientFactoringStatus.Onboarding },
      }),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions[0].key).toBe(TagDefinitionKey.CLIENT_STATUS_ISSUE);
    expect(result.actions[0].noteDetails).not.toBeNull();
  });
});
