import { Injectable, Logger } from '@nestjs/common';
import { AssignInvoiceActivityRule } from './assign-invoice-activity-rule';
import { ChangeActions } from '@common';
import {
  AssignInvoiceActivityRequest,
  CommandInvoiceTaggedContext,
} from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence';
import { BasicEntityUtil } from '@module-persistence/util';
import { TagResolutionService } from '../../../../tag-resolution.service';

const excludeTagsForRule = [
  TagDefinitionKey.NOTIFICATION,
  TagDefinitionKey.PROCESSING,
  TagDefinitionKey.NOTE,
];

@Injectable()
export class BrokerPaymentScheduledRule
  implements AssignInvoiceActivityRule<AssignInvoiceActivityRequest>
{
  private readonly logger = new Logger(BrokerPaymentScheduledRule.name);

  constructor(private readonly tagResolutionService: TagResolutionService) {}

  async run(
    context: CommandInvoiceTaggedContext<AssignInvoiceActivityRequest>,
  ): Promise<ChangeActions> {
    const { invoice, request } = context;
    if (invoice.tags.isEmpty()) {
      return ChangeActions.empty();
    }

    // if the last existing tag is BROKER_PAYMENT_SCHEDULED and we want to flag with another tag, just release it
    const actions = ChangeActions.empty();
    const mostRecentTag = BasicEntityUtil.getLastActiveEntity(invoice.tags);
    if (mostRecentTag == null) {
      return actions;
    }
    if (
      mostRecentTag.tagDefinition.key ===
        TagDefinitionKey.BROKER_PAYMENT_SCHEDULED &&
      !excludeTagsForRule.includes(request.key)
    ) {
      this.logger.log(
        `Invoice ${invoice.id} has ${TagDefinitionKey.BROKER_PAYMENT_SCHEDULED} tag as last tag. Releasing it while assigning ${request.key}`,
      );
      return actions.concat(
        ChangeActions.deleteTag(mostRecentTag.tagDefinition.key, {
          trackDeletion: false,
        }),
      );
    }

    if (request.key !== TagDefinitionKey.BROKER_PAYMENT_SCHEDULED) {
      return actions;
    }

    // if we want to tag with BROKER_PAYMENT_SCHEDULED, released the other tags
    return await this.tagResolutionService.run(invoice);
  }
}
