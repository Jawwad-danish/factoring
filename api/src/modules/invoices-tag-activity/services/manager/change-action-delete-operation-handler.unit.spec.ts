import { ChangeActions } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { EntityStubs } from '@module-persistence/test';
import {
  RecordStatus,
  TagDefinitionKey,
  TagStatus,
} from '@module-persistence/entities';
import { TagDefinitionRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { ChangeActionDeleteOperationHandler } from './change-action-delete-operation-handler';
import { UUID } from '@core/uuid';

describe('ChangeActionDeleteOperationHandler', () => {
  let handler: ChangeActionDeleteOperationHandler;
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
      providers: [mockMikroORMProvider, ChangeActionDeleteOperationHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(ChangeActionDeleteOperationHandler);
    tagRepository = module.get(TagDefinitionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('When change action is delete tag, tag is deleted from invoice and activity is not created', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
    );
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
    });

    await handler.handle(
      ChangeActions.deleteTag(tagDefinitionStub.key).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(1);
    expect(
      invoice.tags.find(
        (invoiceTag) =>
          invoiceTag.tagDefinition.id === tagDefinitionStub.id &&
          invoiceTag.tagDefinition.key === tagDefinitionStub.key &&
          invoiceTag.recordStatus === RecordStatus.Inactive,
      ),
    ).toBeDefined();

    expect(invoice.activities.length).toBe(0);
  });

  it('When change action is delete tag, tag is deleted from invoice and activity is created', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
    );
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
    });

    await handler.handle(
      ChangeActions.deleteTag(tagDefinitionStub.key, {
        trackDeletion: true,
      }).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(1);
    expect(
      invoice.tags.find(
        (invoiceTag) =>
          invoiceTag.tagDefinition.id === tagDefinitionStub.id &&
          invoiceTag.tagDefinition.key === tagDefinitionStub.key &&
          invoiceTag.recordStatus === RecordStatus.Inactive,
      ),
    ).toBeDefined();

    expect(invoice.activities.length).toBe(1);
    expect(
      invoice.activities.find(
        (activity) =>
          activity.tagDefinition.id === tagDefinitionStub.id &&
          activity.tagDefinition.key === tagDefinitionStub.key &&
          activity.tagStatus === TagStatus.Inactive,
      ),
    ).toBeDefined();
  });

  it('When change action is delete tag, and tag is not on invoice, exception is thrown', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(
          EntityStubs.buildStubTagDefinition({
            key: TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
          }),
        ),
      ],
    });

    expect(
      handler.handle(
        ChangeActions.deleteTag(tagDefinitionStub.key).actions[0],
        invoice,
        '',
      ),
    ).rejects.toThrow(ValidationError);
  });

  it('When change action is delete tag, and tag is not on invoice, exception is not thrown if optional', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    const invoice = EntityStubs.buildStubInvoice({
      tags: [
        EntityStubs.buildStubInvoiceTag(
          EntityStubs.buildStubTagDefinition({
            key: TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
          }),
        ),
      ],
    });

    expect(
      handler.handle(
        ChangeActions.deleteTag(tagDefinitionStub.key, { optional: true })
          .actions[0],
        invoice,
        '',
      ),
    ).resolves.not.toThrow();
  });

  it('When change action is delete tag and trackDeletion is false, it deletes the tag but does not create a deletion activity log', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
    );
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
    });

    await handler.handle(
      ChangeActions.deleteTag(tagDefinitionStub.key, {
        trackDeletion: false,
      }).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(1);
    const inactiveTag = invoice.tags.find(
      (invoiceTag) =>
        invoiceTag.tagDefinition.key === tagDefinitionStub.key &&
        invoiceTag.recordStatus === RecordStatus.Inactive,
    );
    expect(inactiveTag).toBeDefined();

    // Verify no new activity was created
    expect(invoice.activities.length).toBe(0);
  });

  it('When change action is delete tag and trackDeletion is true, it deletes the tag and creates a deletion activity log', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
    );
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
    });

    await handler.handle(
      ChangeActions.deleteTag(tagDefinitionStub.key, {
        trackDeletion: true,
      }).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(1);
    const inactiveTag = invoice.tags.find(
      (invoiceTag) =>
        invoiceTag.tagDefinition.key === tagDefinitionStub.key &&
        invoiceTag.recordStatus === RecordStatus.Inactive,
    );
    expect(inactiveTag).toBeDefined();

    // Verify a new activity was created
    expect(invoice.activities.length).toBe(1);
    const activity = invoice.activities.getItems()[0];
    expect(activity.tagDefinition.key).toBe(tagDefinitionStub.key);
    expect(activity.tagStatus).toBe(TagStatus.Inactive);
  });

  it('When change action is delete tag and trackDeletion is not specified, it defaults to not creating a deletion activity log', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
    );
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
    });

    await handler.handle(
      ChangeActions.deleteTag(tagDefinitionStub.key).actions[0],
      invoice,
      '',
    );

    expect(invoice.tags.length).toBe(1);
    const inactiveTag = invoice.tags.find(
      (invoiceTag) =>
        invoiceTag.tagDefinition.key === tagDefinitionStub.key &&
        invoiceTag.recordStatus === RecordStatus.Inactive,
    );
    expect(inactiveTag).toBeDefined();

    expect(invoice.activities.length).toBe(0);
  });

  it('When change action is delete activity, tag and activity are deleted from invoice', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    const activityEntityStub = EntityStubs.buildStubActivity(tagDefinitionStub);
    const invoice = EntityStubs.buildStubInvoice({
      tags: [EntityStubs.buildStubInvoiceTag(tagDefinitionStub)],
      activities: [activityEntityStub],
    });

    await handler.handle(
      ChangeActions.deleteTagActivity(activityEntityStub.id, null, {
        trackDeletion: true,
      }).actions[0],
      invoice,
      '',
    );

    expect(invoice.activities.length).toBe(2);
    // Initial activity is not deleted
    expect(
      invoice.activities.find(
        (activity) =>
          activity.tagDefinition.id === tagDefinitionStub.id &&
          activity.tagDefinition.key === tagDefinitionStub.key &&
          activity.tagStatus === TagStatus.Active &&
          activity.recordStatus === RecordStatus.Inactive,
      ),
    ).toBeDefined();

    // New activity to reflect the tag deletion
    expect(
      invoice.activities.find(
        (activity) =>
          activity.tagDefinition.id === tagDefinitionStub.id &&
          activity.tagDefinition.key === tagDefinitionStub.key &&
          activity.tagStatus === TagStatus.Inactive &&
          activity.recordStatus === RecordStatus.Active,
      ),
    ).toBeDefined();
    expect(
      invoice.tags.find(
        (invoiceTag) =>
          invoiceTag.tagDefinition.id === tagDefinitionStub.id &&
          invoiceTag.tagDefinition.key === tagDefinitionStub.key &&
          invoiceTag.recordStatus === RecordStatus.Inactive,
      ),
    ).toBeDefined();
  });

  it('When change action is delete activity, and activity is not on invoice, exception is thrown', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    const invoice = EntityStubs.buildStubInvoice({
      activities: [EntityStubs.buildStubActivity(tagDefinitionStub)],
    });

    expect(
      handler.handle(
        ChangeActions.deleteTagActivity(UUID.get(), null).actions[0],
        invoice,
        '',
      ),
    ).rejects.toThrow(ValidationError);
  });

  it('When change action is delete activity, and activity is not on invoice, but operation is optional, exception is not thrown', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    const invoice = EntityStubs.buildStubInvoice({
      activities: [EntityStubs.buildStubActivity(tagDefinitionStub)],
    });

    expect(
      handler.handle(
        ChangeActions.deleteTagActivity(UUID.get(), null, { optional: true })
          .actions[0],
        invoice,
        '',
      ),
    ).resolves.not.toThrowError();
  });

  it('When change action is delete activity, and activity is already deleted, exception is thrown', async () => {
    const tagDefinitionStub = mockTagRepositoryGetByKey(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    const activity = EntityStubs.buildStubActivity(tagDefinitionStub);
    activity.recordStatus = RecordStatus.Inactive;
    const invoice = EntityStubs.buildStubInvoice({
      activities: [activity],
    });

    expect(
      handler.handle(
        ChangeActions.deleteTagActivity(activity.id, null).actions[0],
        invoice,
        '',
      ),
    ).rejects.toThrow(ValidationError);
  });
});
