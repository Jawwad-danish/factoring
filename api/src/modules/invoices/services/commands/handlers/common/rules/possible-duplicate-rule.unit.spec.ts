import { ChangeOperation } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { InvoiceMapper, UpdateInvoiceRequest } from '@module-invoices/data';
import {
  InvoiceTagEntity,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { TagDefinitionMapper } from '@module-tag-definitions';
import { Test, TestingModule } from '@nestjs/testing';
import { DuplicateDetectionEngine } from '../../../../engines';
import { PossibleDuplicateRule } from './possible-duplicate-rule';

describe('Possible duplicate Rule', () => {
  let possibleDuplicateRule: PossibleDuplicateRule<
    CreateInvoiceRequest | UpdateInvoiceRequest
  >;
  let duplicateDetectionEngine: DuplicateDetectionEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        PossibleDuplicateRule,
        InvoiceMapper,
        TagDefinitionMapper,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    possibleDuplicateRule = module.get(PossibleDuplicateRule);
    duplicateDetectionEngine = module.get(DuplicateDetectionEngine);
  }, 60000);

  it('PossibleDuplicateRule should be defined', () => {
    expect(possibleDuplicateRule).toBeDefined();
  });

  it('If invoice is possible duplicate, return tag activity', async () => {
    jest.spyOn(duplicateDetectionEngine, 'run').mockResolvedValueOnce([
      {
        invoice: EntityStubs.buildStubInvoice(),
        totalWeight: 10,
        weights: [],
      },
    ]);
    const result = await possibleDuplicateRule.run({
      entity: EntityStubs.buildStubInvoice(),
      payload: new CreateInvoiceRequest(),
      broker: buildStubBroker(),
      client: buildStubClient(),
    });

    expect(result.actions[0].key).toBe(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    );
    expect(result.actions[0].noteDetails).not.toBeNull();
  });

  it('If invoice is no longer possible duplicate, mark it for deleting the tag', async () => {
    jest.spyOn(duplicateDetectionEngine, 'run').mockResolvedValueOnce([]);
    const stubInvoiceTagEntity = new InvoiceTagEntity();
    stubInvoiceTagEntity.tagDefinition = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    });
    const stubInvoiceEntity = EntityStubs.buildStubInvoice({
      tags: [stubInvoiceTagEntity],
    });
    const result = await possibleDuplicateRule.run({
      entity: stubInvoiceEntity,
      payload: new UpdateInvoiceRequest(),
      broker: buildStubBroker(),
      client: buildStubClient(),
    });

    expect(result.actions[0].key).toBe(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    );
    expect(result.actions[0].properties.operation).toBe(ChangeOperation.Delete);
  });
});
