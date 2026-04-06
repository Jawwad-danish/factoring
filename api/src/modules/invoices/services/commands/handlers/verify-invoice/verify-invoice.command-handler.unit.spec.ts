import { ChangeActions, ChangeSubject } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import { createMock } from '@golevelup/ts-jest';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { QueryRunner } from '@module-cqrs';
import { VerifyInvoiceRequestBuilder } from '@module-invoices/test';
import {
  InvoiceEntity,
  RecordStatus,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceChangeActionsExecutor } from '../../../../../invoices-tag-activity';
import { VerifyInvoiceCommand } from '../../verify-invoice.command';
import { VerifyInvoiceRuleService } from './rules';
import { VerifyInvoiceCommandHandler } from './verify-invoice.command-handler';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceRepository } from '@module-persistence/repositories';

describe('Verify invoice command handler', () => {
  const queryRunner = createMock<QueryRunner>();
  const ruleService = createMock<VerifyInvoiceRuleService>();
  const repository = createMock<InvoiceRepository>();
  const changeActionsExecutor = createMock<InvoiceChangeActionsExecutor>();
  let handler: VerifyInvoiceCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryRunner,
        VerifyInvoiceCommandHandler,
        VerifyInvoiceRuleService,
        InvoiceRepository,
        InvoiceChangeActionsExecutor,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(QueryRunner)
      .useValue(queryRunner)
      .overrideProvider(VerifyInvoiceRuleService)
      .useValue(ruleService)
      .overrideProvider(InvoiceRepository)
      .useValue(repository)
      .overrideProvider(InvoiceChangeActionsExecutor)
      .useValue(changeActionsExecutor)

      .compile();

    handler = module.get(VerifyInvoiceCommandHandler);
  });

  const mockQueryRunner = () => {
    queryRunner.run.mockResolvedValueOnce([
      buildStubClient(),
      buildStubBroker(),
    ]);
  };

  const mockInvoiceRepository = (invoiceEntity?: InvoiceEntity) => {
    const value = invoiceEntity || EntityStubs.buildStubInvoice();
    // loading of entity before verify operation
    repository.getOneById.mockResolvedValueOnce(value);
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

  it('Verification status is updated', async () => {
    mockQueryRunner();
    mockRuleService();

    const entity = EntityStubs.buildStubInvoice();
    mockInvoiceRepository(entity);
    const verifyPayload = new VerifyInvoiceRequestBuilder().getRequest();

    await handler.execute(new VerifyInvoiceCommand(UUID.get(), verifyPayload));

    expect(entity.verificationStatus).toBe(verifyPayload.status);
  });

  describe('Verification (no waiting for verification)', () => {
    it('Tag not added, only activity', async () => {
      mockQueryRunner();
      mockRuleService();

      const entity = EntityStubs.buildStubInvoice();
      mockInvoiceRepository(entity);
      const verifyPayload = new VerifyInvoiceRequestBuilder().getRequest();

      await handler.execute(
        new VerifyInvoiceCommand(UUID.get(), verifyPayload),
      );

      expect(entity.verificationStatus).toBe(verifyPayload.status);
      expect(
        entity.tags.find(
          (tag) =>
            tag.tagDefinition.key === TagDefinitionKey.VERIFY_INVOICE &&
            tag.recordStatus === RecordStatus.Active,
        ),
      ).not.toBeNull();
    });

    it('Tag is not added if already tagged', async () => {
      mockQueryRunner();
      mockRuleService();
      const existingTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.VERIFY_INVOICE,
      });

      const entity = EntityStubs.buildStubInvoice({
        tags: [EntityStubs.buildStubInvoiceTag(existingTag)],
        activities: [EntityStubs.buildStubActivity(existingTag)],
      });
      mockInvoiceRepository(entity);
      const verifyPayload = new VerifyInvoiceRequestBuilder({
        status: VerificationStatus.Verified,
      }).getRequest();

      await handler.execute(
        new VerifyInvoiceCommand(UUID.get(), verifyPayload),
      );

      expect(entity.verificationStatus).toBe(verifyPayload.status);
      expect(changeActionsExecutor.apply).toBeCalledWith(
        entity,
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({
              input: expect.objectContaining({
                key: TagDefinitionKey.VERIFY_INVOICE,
              }),
              properties: expect.objectContaining({
                subject: ChangeSubject.Activity,
              }),
            }),
          ]),
        }),
      );
    });
  });

  describe('Verification (waiting for verification)', () => {
    it('Tag is added if not already tagged', async () => {
      mockQueryRunner();
      mockRuleService();

      const entity = EntityStubs.buildStubInvoice();
      mockInvoiceRepository(entity);
      const verifyPayload = new VerifyInvoiceRequestBuilder({
        status: VerificationStatus.InProgress,
      }).getRequest();

      await handler.execute(
        new VerifyInvoiceCommand(UUID.get(), verifyPayload),
      );

      expect(entity.verificationStatus).toBe(verifyPayload.status);
      expect(
        entity.tags.find(
          (tag) =>
            tag.tagDefinition.key ===
              TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION &&
            tag.recordStatus === RecordStatus.Active,
        ),
      ).not.toBeNull();
    });

    it('Tag is added even if already tagged', async () => {
      mockQueryRunner();
      mockRuleService();

      const existingTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION,
      });

      const entity = EntityStubs.buildStubInvoice({
        tags: [EntityStubs.buildStubInvoiceTag(existingTag)],

        activities: [EntityStubs.buildStubActivity(existingTag)],
      });
      mockInvoiceRepository(entity);
      const verifyPayload = new VerifyInvoiceRequestBuilder({
        status: VerificationStatus.InProgress,
      }).getRequest();

      await handler.execute(
        new VerifyInvoiceCommand(UUID.get(), verifyPayload),
      );

      expect(entity.verificationStatus).toBe(verifyPayload.status);
      expect(changeActionsExecutor.apply).toBeCalledWith(
        entity,
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({
              input: expect.objectContaining({
                key: TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION,
              }),
              properties: expect.objectContaining({
                subject: ChangeSubject.TagActivity,
              }),
            }),
          ]),
        }),
      );
    });
  });
});
