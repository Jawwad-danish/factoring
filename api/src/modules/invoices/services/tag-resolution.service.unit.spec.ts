import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  TagDefinitionGroupKey,
  TagDefinitionKey,
  TagDefinitionLevel,
} from '@module-persistence/entities';
import { TagDefinitionRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { TagResolutionService } from './tag-resolution.service';

describe('TagResolutionService', () => {
  let service: TagResolutionService;
  const tagDefinitionRepository = createMock<TagDefinitionRepository>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagResolutionService,
        mockMikroORMProvider,
        TagDefinitionRepository,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(TagDefinitionRepository)
      .useValue(tagDefinitionRepository)
      .compile();

    service = module.get(TagResolutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  it('When invoice has no tags, returns empty change actions', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      tags: [],
    });

    const result = await service.run(invoice);

    expect(result.isEmpty()).toBe(true);
    expect(tagDefinitionRepository.findByGroup).not.toHaveBeenCalled();
  });

  it('When invoice has only non-resolvable tags, returns empty change actions', async () => {
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

    tagDefinitionRepository.findByGroup.mockResolvedValue([
      clientLimitTag,
      brokerLimitTag,
    ]);

    const result = await service.run(invoice);

    expect(result.isEmpty()).toBe(true);
    expect(tagDefinitionRepository.findByGroup).toHaveBeenCalledWith(
      TagDefinitionGroupKey.INTERNAL_INVOICE_ISSUES,
    );
  });

  it('When invoice has only resolvable tags, returns delete actions for all tags', async () => {
    const brokerNotFoundTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_NOT_FOUND,
    });
    const verificationEngineTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.VERIFICATION_ENGINE,
    });

    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(brokerNotFoundTag),
        EntityStubs.buildStubInvoiceTag(verificationEngineTag),
      ],
    });

    tagDefinitionRepository.findByGroup.mockResolvedValue([]);

    const result = await service.run(invoice);

    expect(result.isEmpty()).toBe(false);
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0].key).toBe(TagDefinitionKey.BROKER_NOT_FOUND);
    expect(result.actions[0].isDelete()).toBe(true);
    expect(result.actions[0].properties.trackDeletion).toBe(false);
    expect(result.actions[1].key).toBe(TagDefinitionKey.VERIFICATION_ENGINE);
    expect(result.actions[1].isDelete()).toBe(true);
    expect(result.actions[1].properties.trackDeletion).toBe(false);
    expect(tagDefinitionRepository.findByGroup).toHaveBeenCalledWith(
      TagDefinitionGroupKey.INTERNAL_INVOICE_ISSUES,
    );
  });

  it('When invoice has mixed resolvable and non-resolvable tags, returns delete actions only for resolvable tags', async () => {
    const clientLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
    });
    const brokerLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
    });
    const brokerNotFoundTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_NOT_FOUND,
    });
    const missingDocumentTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.MISSING_DOCUMENT,
    });

    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(clientLimitTag),
        EntityStubs.buildStubInvoiceTag(brokerLimitTag),
        EntityStubs.buildStubInvoiceTag(brokerNotFoundTag),
        EntityStubs.buildStubInvoiceTag(missingDocumentTag),
      ],
    });

    tagDefinitionRepository.findByGroup.mockResolvedValue([
      clientLimitTag,
      brokerLimitTag,
      missingDocumentTag,
    ]);

    tagDefinitionRepository.findByGroup.mockResolvedValue([
      clientLimitTag,
      brokerLimitTag,
    ]);

    const result = await service.run(invoice);

    expect(result.isEmpty()).toBe(false);
    expect(result.actions).toHaveLength(2);

    const deleteActions = result.actions.filter((action) => action.isDelete());
    expect(deleteActions).toHaveLength(2);

    const deletedTagKeys = deleteActions.map((action) => action.key);
    expect(deletedTagKeys).toContain(TagDefinitionKey.BROKER_NOT_FOUND);
    expect(deletedTagKeys).toContain(TagDefinitionKey.MISSING_DOCUMENT);
    expect(deletedTagKeys).not.toContain(
      TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
    );
    expect(deletedTagKeys).not.toContain(
      TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
    );

    deleteActions.forEach((action) => {
      expect(action.properties.trackDeletion).toBe(false);
    });

    expect(tagDefinitionRepository.findByGroup).toHaveBeenCalledWith(
      TagDefinitionGroupKey.INTERNAL_INVOICE_ISSUES,
    );
  });

  it('When invoice has mixed levels and keys, only resolves Warning/Error level tags that are not in NON_RESOLVABLE_TAGS', async () => {
    const clientLimitErrorTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
      level: TagDefinitionLevel.Error,
    });
    const brokerLimitWarningTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
      level: TagDefinitionLevel.Warning,
    });
    const brokerNotFoundInfoTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_NOT_FOUND,
      level: TagDefinitionLevel.Info,
    });
    const missingDocumentWarningTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.MISSING_DOCUMENT,
      level: TagDefinitionLevel.Warning,
    });
    const verificationEngineErrorTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.VERIFICATION_ENGINE,
      level: TagDefinitionLevel.Error,
    });

    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(clientLimitErrorTag),
        EntityStubs.buildStubInvoiceTag(brokerLimitWarningTag),
        EntityStubs.buildStubInvoiceTag(brokerNotFoundInfoTag),
        EntityStubs.buildStubInvoiceTag(missingDocumentWarningTag),
        EntityStubs.buildStubInvoiceTag(verificationEngineErrorTag),
      ],
    });

    tagDefinitionRepository.findByGroup.mockResolvedValue([
      clientLimitErrorTag,
      brokerLimitWarningTag,
    ]);

    const result = await service.run(invoice);

    expect(result.isEmpty()).toBe(false);
    expect(result.actions).toHaveLength(2);

    const deleteActions = result.actions.filter((action) => action.isDelete());
    expect(deleteActions).toHaveLength(2);

    const deletedTagKeys = deleteActions.map((action) => action.key);
    expect(deletedTagKeys).toContain(TagDefinitionKey.MISSING_DOCUMENT);
    expect(deletedTagKeys).toContain(TagDefinitionKey.VERIFICATION_ENGINE);
    expect(deletedTagKeys).not.toContain(
      TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
    );
    expect(deletedTagKeys).not.toContain(
      TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
    );
    expect(deletedTagKeys).not.toContain(TagDefinitionKey.BROKER_NOT_FOUND);
    expect(tagDefinitionRepository.findByGroup).toHaveBeenCalledWith(
      TagDefinitionGroupKey.INTERNAL_INVOICE_ISSUES,
    );
  });

  it('When ignoreTags option is provided, should not resolve ignored tags', async () => {
    const brokerNotFoundTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_NOT_FOUND,
    });
    const possibleDuplicateTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    });
    const verificationEngineTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.VERIFICATION_ENGINE,
    });

    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(brokerNotFoundTag),
        EntityStubs.buildStubInvoiceTag(possibleDuplicateTag),
        EntityStubs.buildStubInvoiceTag(verificationEngineTag),
      ],
    });

    tagDefinitionRepository.findByGroup.mockResolvedValue([]);

    const result = await service.run(invoice, {
      ignoreTags: [TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE],
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.actions).toHaveLength(2);

    const deletedTagKeys = result.actions.map((action) => action.key);
    expect(deletedTagKeys).toContain(TagDefinitionKey.BROKER_NOT_FOUND);
    expect(deletedTagKeys).toContain(TagDefinitionKey.VERIFICATION_ENGINE);
    expect(deletedTagKeys).not.toContain(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    );
  });

  it('When ignoreTags option contains multiple tags, should not resolve any of them', async () => {
    const brokerNotFoundTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_NOT_FOUND,
    });
    const possibleDuplicateTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    });
    const lowCreditRatingTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    });
    const verificationEngineTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.VERIFICATION_ENGINE,
    });

    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(brokerNotFoundTag),
        EntityStubs.buildStubInvoiceTag(possibleDuplicateTag),
        EntityStubs.buildStubInvoiceTag(lowCreditRatingTag),
        EntityStubs.buildStubInvoiceTag(verificationEngineTag),
      ],
    });

    tagDefinitionRepository.findByGroup.mockResolvedValue([]);

    const result = await service.run(invoice, {
      ignoreTags: [
        TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
        TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
      ],
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.actions).toHaveLength(2);

    const deletedTagKeys = result.actions.map((action) => action.key);
    expect(deletedTagKeys).toContain(TagDefinitionKey.BROKER_NOT_FOUND);
    expect(deletedTagKeys).toContain(TagDefinitionKey.VERIFICATION_ENGINE);
    expect(deletedTagKeys).not.toContain(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    );
    expect(deletedTagKeys).not.toContain(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
  });
});
