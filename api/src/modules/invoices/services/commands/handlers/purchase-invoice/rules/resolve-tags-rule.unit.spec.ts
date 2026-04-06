import { ChangeActions } from '@common';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  buildStubCommandInvoiceContext,
  PurchaseInvoiceRequestBuilder,
} from '@module-invoices/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { TagResolutionService } from '../../../../tag-resolution.service';
import { ResolveTagsRule } from './resolve-tags-rule';

describe('ResolveTagsRule', () => {
  let rule: ResolveTagsRule;
  const tagResolutionService = createMock<TagResolutionService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResolveTagsRule, mockMikroORMProvider, TagResolutionService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(TagResolutionService)
      .useValue(tagResolutionService)
      .compile();

    rule = module.get(ResolveTagsRule);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Should delegate to TagResolutionService', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      tags: [],
    });

    const context = buildStubCommandInvoiceContext({
      entity: invoice,
      payload: new PurchaseInvoiceRequestBuilder().getRequest(),
    });

    const expectedResult = ChangeActions.empty();
    tagResolutionService.run.mockResolvedValue(expectedResult);

    const result = await rule.run(context);

    expect(tagResolutionService.run).toHaveBeenCalledWith(invoice, {
      ignoreTags: [
        TagDefinitionKey.BROKER_NOT_FOUND,
        TagDefinitionKey.MAIL_INVOICE_ORIGINAL,
        TagDefinitionKey.BROKER_INFORMATION_MISSING,
      ],
    });
    expect(result).toBe(expectedResult);
  });
});
