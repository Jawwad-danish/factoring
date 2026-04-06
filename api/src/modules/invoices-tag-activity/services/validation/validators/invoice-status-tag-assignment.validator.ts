import { ValidationError, Validator } from '@core/validation';
import {
  InvoiceEntity,
  InvoiceStatus,
  TagDefinitionEntity,
  TagDefinitionGroupKey,
} from '@module-persistence/entities';
import { TagDefinitionGroupRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoiceStatusTagAssignmentValidator
  implements Validator<[InvoiceEntity, TagDefinitionEntity]>
{
  constructor(
    private tagDefinitionGroupRepository: TagDefinitionGroupRepository,
  ) {}

  async validate(context: [InvoiceEntity, TagDefinitionEntity]): Promise<void> {
    const [invoice, tag] = context;
    if (invoice.status === InvoiceStatus.UnderReview) {
      if (
        !(await this.isPartOfAnyGroup(tag, [
          TagDefinitionGroupKey.INVOICE_ISSUES,
          TagDefinitionGroupKey.PROCESSING_ACTION_ITEMS,
          TagDefinitionGroupKey.REJECTION_REASONS,
          TagDefinitionGroupKey.TECHNICAL_ISSUES,
          TagDefinitionGroupKey.OTHER,
          TagDefinitionGroupKey.ISSUES_SENDING_INVOICE_TO_BROKER,
          TagDefinitionGroupKey.INTERNAL_INVOICE_ISSUES,
        ]))
      ) {
        throw new ValidationError(
          'tag-assignment',
          `Cannot assign tag ${tag.key} because it's not part of any valid group for the current invoice status`,
        );
      }
    }
    if (invoice.status === InvoiceStatus.Purchased) {
      if (
        !(await this.isPartOfAnyGroup(tag, [
          TagDefinitionGroupKey.ISSUES_SENDING_INVOICE_TO_BROKER,
          TagDefinitionGroupKey.CLIENT_PAYMENT_ISSUES,
          TagDefinitionGroupKey.BROKER_PAYMENT_ISSUES,
          TagDefinitionGroupKey.BROKER_PAYMENT_ACTION_ITEMS,
          TagDefinitionGroupKey.NON_PAYMENT_REASONS,
          TagDefinitionGroupKey.INVOICE_ISSUES,
          TagDefinitionGroupKey.OTHER,
          TagDefinitionGroupKey.INTERNAL_INVOICE_ISSUES,
        ]))
      ) {
        throw new ValidationError(
          'tag-assignment',
          `Cannot assign tag ${tag.key} because it's not part of any valid group for the current invoice status`,
        );
      }
    }
  }

  async anyTagIsPartOfAnyGroup(
    tags: TagDefinitionEntity[],
    keys: TagDefinitionGroupKey[],
  ): Promise<boolean> {
    const tagIds = tags.map((tag) => tag.id);
    const groups = await this.tagDefinitionGroupRepository.findByKeys(keys);
    for (const group of groups) {
      const found = group.tags
        .getItems()
        .some((groupTag) => tagIds.includes(groupTag.tag.id));
      if (found) {
        return true;
      }
    }
    return false;
  }

  private isPartOfAnyGroup(
    tag: TagDefinitionEntity,
    keys: TagDefinitionGroupKey[],
  ): Promise<boolean> {
    return this.anyTagIsPartOfAnyGroup([tag], keys);
  }
}
