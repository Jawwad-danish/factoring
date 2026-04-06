import { ChangeActions } from '@common';
import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { buildStubClient } from '@module-clients/test';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import {
  EntityStubs,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { TagResolutionService } from '../../../../tag-resolution.service';
import { ResolveTagsOnUpdateRule } from './resolve-tags-on-update-rule';

describe('ResolveTagsOnUpdateRule', () => {
  let rule: ResolveTagsOnUpdateRule;
  const mockTagResolutionService = createMock<TagResolutionService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResolveTagsOnUpdateRule,
        {
          provide: TagResolutionService,
          useValue: mockTagResolutionService,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get<ResolveTagsOnUpdateRule>(ResolveTagsOnUpdateRule);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty ChangeActions when invoice status is Purchased', async () => {
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
    });
    const context: CommandInvoiceContext<UpdateInvoiceRequest> = {
      entity,
      client: buildStubClient(),
      broker: null,
      payload: {},
    };

    const result = await rule.run(context);

    expect(result).toEqual(ChangeActions.empty());
    expect(mockTagResolutionService.run).not.toHaveBeenCalled();
  });

  it('should call tagResolutionService.run with ignoreTags when invoice status is not Purchased', async () => {
    const mockChangeActions = {
      actions: [{ type: 'DELETE_TAG', payload: { key: 'test-tag' } }],
    } as any;
    mockTagResolutionService.run.mockResolvedValue(mockChangeActions);

    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.UnderReview,
    });
    const context: CommandInvoiceContext<UpdateInvoiceRequest> = {
      entity,
      client: buildStubClient(),
      broker: null,
      payload: {},
    };

    const result = await rule.run(context);

    expect(result).toEqual(mockChangeActions);
    expect(mockTagResolutionService.run).toHaveBeenCalledWith(entity, {
      ignoreTags: [
        TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
        TagDefinitionKey.BROKER_NOT_FOUND,
        TagDefinitionKey.BROKER_INFORMATION_MISSING,
        TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
        TagDefinitionKey.CLIENT_STATUS_ISSUE,
      ],
    });
  });
});
