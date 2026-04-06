import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { FeatureFlagResolver } from '@module-common';
import { TagDefinitionKey } from '@module-persistence/entities';
import { TagDefinitionRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceTagAssignmentValidationService } from '../validation';
import { ChangeActionAssignOperationHandler } from './change-action-assign-operation-handler';

describe('ChangeActionAssignOperationHandler', () => {
  let handler: ChangeActionAssignOperationHandler;
  let validationService: InvoiceTagAssignmentValidationService;
  let featureFlagResolver: FeatureFlagResolver;
  let tagRepository: TagDefinitionRepository;

  const mockTagRepositoryGetByKey = (
    key: TagDefinitionKey = TagDefinitionKey.BROKER_NOT_FOUND,
  ) => {
    const entity = EntityStubs.buildStubTagDefinition({
      key,
    });
    jest.spyOn(tagRepository, 'getByKey').mockResolvedValue(entity);
    return entity;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, ChangeActionAssignOperationHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    handler = module.get(ChangeActionAssignOperationHandler);
    validationService = module.get(InvoiceTagAssignmentValidationService);
    tagRepository = module.get(TagDefinitionRepository);
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('When change action is only tag, tag is assigned to invoice', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey();
    const invoice = EntityStubs.buildStubInvoice();

    await handler.handle(
      ChangeActions.addTag(tagDefinitionStub.key).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(1);
    expect(
      invoice.tags.find(
        (invoiceTag) =>
          invoiceTag.tagDefinition.id === tagDefinitionStub.id &&
          invoiceTag.tagDefinition.key === tagDefinitionStub.key,
      ),
    ).toBeDefined();

    expect(invoice.activities.length).toBe(0);
    expect(jest.spyOn(validationService, 'validate')).toBeCalledTimes(1);
  });

  it('When change action is tag and activity, tag and activity are assigned to invoice', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey();
    const invoice = EntityStubs.buildStubInvoice();

    await handler.handle(
      ChangeActions.addTagAndActivity(
        tagDefinitionStub.key,
        Note.fromText('Note'),
      ).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(1);
    expect(
      invoice.tags.find(
        (invoiceTag) =>
          invoiceTag.tagDefinition.id === tagDefinitionStub.id &&
          invoiceTag.tagDefinition.key === tagDefinitionStub.key,
      ),
    ).toBeDefined();

    expect(invoice.activities.length).toBe(1);
    expect(
      invoice.activities.find(
        (activity) =>
          activity.tagDefinition.id === tagDefinitionStub.id &&
          activity.tagDefinition.key === tagDefinitionStub.key &&
          activity.note === 'Note',
      ),
    ).toBeDefined();
  });

  it('When change action is activity, activity is assigned to invoice', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(TagDefinitionKey.NOTE);
    const invoice = EntityStubs.buildStubInvoice();

    await handler.handle(
      ChangeActions.addActivity(tagDefinitionStub.key, Note.fromText('Note'))
        .actions[0],
      invoice,
      '',
    );

    expect(invoice.activities.length).toBe(1);
    expect(
      invoice.activities.find(
        (activity) =>
          activity.tagDefinition.id === tagDefinitionStub.id &&
          activity.tagDefinition.key === tagDefinitionStub.key &&
          activity.note === 'Note',
      ),
    ).toBeDefined();
  });

  it('When change action is note tag and activity, only activity is assigned to invoice', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(TagDefinitionKey.NOTE);
    const invoice = EntityStubs.buildStubInvoice();

    await handler.handle(
      ChangeActions.addTagAndActivity(
        tagDefinitionStub.key,
        Note.fromText('Note'),
      ).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(0);
    expect(invoice.activities.length).toBe(1);
    expect(
      invoice.activities.find(
        (activity) =>
          activity.tagDefinition.id === tagDefinitionStub.id &&
          activity.tagDefinition.key === tagDefinitionStub.key &&
          activity.note === 'Note',
      ),
    ).toBeDefined();
  });

  it('When change action is processing tag and activity, only activity is assigned to invoice', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.PROCESSING,
    );
    const invoice = EntityStubs.buildStubInvoice();

    await handler.handle(
      ChangeActions.addTagAndActivity(
        tagDefinitionStub.key,
        Note.fromText('Note'),
      ).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(0);
    expect(invoice.activities.length).toBe(1);
    expect(
      invoice.activities.find(
        (activity) =>
          activity.tagDefinition.id === tagDefinitionStub.id &&
          activity.tagDefinition.key === tagDefinitionStub.key &&
          activity.note === 'Note',
      ),
    ).toBeDefined();
  });

  it('When change action is rejection tag, and invoice is already tagged, only activity is assigned to invoice', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    jest
      .spyOn(validationService, 'anyTagIsPartOfAnyGroup')
      .mockResolvedValueOnce(true);
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
    });

    await handler.handle(
      ChangeActions.addTagAndActivity(
        tagDefinitionStub.key,
        Note.fromText('Note'),
      ).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(1);
    expect(invoice.activities.length).toBe(1);
    expect(
      invoice.activities.find(
        (activity) =>
          activity.tagDefinition.id === tagDefinitionStub.id &&
          activity.tagDefinition.key === tagDefinitionStub.key &&
          activity.note === 'Note',
      ),
    ).toBeDefined();
  });

  it('When change is tag, and invoice is already tagged, exception is thrown', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
    );
    jest
      .spyOn(validationService, 'anyTagIsPartOfAnyGroup')
      .mockResolvedValueOnce(false);
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
    });

    expect(
      handler.handle(
        ChangeActions.addTagAndActivity(
          tagDefinitionStub.key,
          Note.fromText('Note'),
        ).actions[0],
        invoice,
        '',
      ),
    ).rejects.toThrow(ValidationError);
  });

  it('When change is tag, and invoice is already tagged,and feature flag is true, tag is added', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
    );
    jest
      .spyOn(validationService, 'anyTagIsPartOfAnyGroup')
      .mockResolvedValueOnce(false);

    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
    });

    await handler.handle(
      ChangeActions.addTagAndActivity(
        tagDefinitionStub.key,
        Note.fromText('Note'),
      ).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(2);
    expect(invoice.activities.length).toBe(1);
    expect(jest.spyOn(validationService, 'validate')).toBeCalledTimes(0);
  });
});
