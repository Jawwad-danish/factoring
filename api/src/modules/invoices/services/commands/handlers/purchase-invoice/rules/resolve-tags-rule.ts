import { ChangeActions } from '@common';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { TagResolutionService } from '../../../../tag-resolution.service';
import { InvoiceRule } from '../../common/rules/invoice-rule';

const IGNORED_TAGS = [
  TagDefinitionKey.BROKER_NOT_FOUND,
  TagDefinitionKey.MAIL_INVOICE_ORIGINAL,
  TagDefinitionKey.BROKER_INFORMATION_MISSING,
];

@Injectable()
export class ResolveTagsRule implements InvoiceRule<PurchaseInvoiceRequest> {
  constructor(private readonly tagResolutionService: TagResolutionService) {}

  async run({
    entity,
  }: CommandInvoiceContext<PurchaseInvoiceRequest>): Promise<ChangeActions> {
    return this.tagResolutionService.run(entity, {
      ignoreTags: IGNORED_TAGS,
    });
  }
}
