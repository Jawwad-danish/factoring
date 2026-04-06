import { ChangeActions } from '@common';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InvoiceRule } from '../../common';
import { TagDefinitionKey } from '@module-persistence/entities';
import { TagResolutionService } from '../../../../tag-resolution.service';

// These tags are handled in other rules
const IGNORED_TAGS = [
  TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
  TagDefinitionKey.BROKER_NOT_FOUND,
  TagDefinitionKey.BROKER_INFORMATION_MISSING,
  TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
  TagDefinitionKey.CLIENT_STATUS_ISSUE,
];

@Injectable()
export class ResolveTagsOnUpdateRule
  implements InvoiceRule<UpdateInvoiceRequest>
{
  private logger = new Logger(ResolveTagsOnUpdateRule.name);

  constructor(private readonly tagResolutionService: TagResolutionService) {}

  async run(
    context: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<ChangeActions> {
    if (context.entity.status === InvoiceStatus.Purchased) {
      this.logger.log(
        'Invoice is purchased. Flags do not get resolved on edit.',
      );
      return ChangeActions.empty();
    }

    return this.tagResolutionService.run(context.entity, {
      ignoreTags: IGNORED_TAGS,
    });
  }
}
