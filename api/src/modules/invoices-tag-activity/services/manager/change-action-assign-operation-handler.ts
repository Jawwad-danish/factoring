import { ChangeAction, ChangeActor, ChangeSubject } from '@common';
import { Note } from '@core/data';
import { ValidationError } from '@core/validation';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import {
  ActivityLogEntity,
  InvoiceEntity,
  InvoiceTagEntity,
  TagDefinitionEntity,
  TagDefinitionGroupKey,
  TagDefinitionKey,
  TagDefinitionRepository,
  UsedByType,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import { InvoiceTagAssignmentValidationService } from '../validation';
import { invoiceContainsActiveTag } from './util';

export enum AssignmentAction {
  None = 'none',
  OnlyActivity = 'only-activity',
  TagAndActivity = 'tag-activity',
}

@Injectable()
export class ChangeActionAssignOperationHandler {
  private logger = new Logger(ChangeActionAssignOperationHandler.name);

  constructor(
    private readonly tagDefinitionRepository: TagDefinitionRepository,
    private readonly invoiceTagAssignmentValidationService: InvoiceTagAssignmentValidationService,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {}

  async handle(
    changeAction: ChangeAction,
    invoice: InvoiceEntity,
    groupId: string,
  ) {
    const tag = await this.getTag(changeAction, invoice);
    const shouldAssignTag = [
      ChangeSubject.Tag,
      ChangeSubject.TagActivity,
    ].includes(changeAction.properties.subject);

    const shouldAssignActivity = [
      ChangeSubject.Activity,
      ChangeSubject.TagActivity,
    ].includes(changeAction.properties.subject);
    const assignmentAction = shouldAssignTag
      ? await this.getAssignmentAction(invoice, tag, changeAction)
      : shouldAssignActivity
      ? AssignmentAction.OnlyActivity
      : AssignmentAction.None;

    if (
      shouldAssignTag &&
      assignmentAction === AssignmentAction.TagAndActivity
    ) {
      this.appendTag(invoice, tag, changeAction.properties.actor);
    }

    if (shouldAssignActivity && assignmentAction !== AssignmentAction.None) {
      if (!changeAction.noteDetails) {
        this.logger.error(
          'Cannot assign tag activity because no note details were provided',
          {
            invoiceId: invoice.id,
            loadNumber: invoice.loadNumber,
            tag: tag.key,
          },
        );
        throw new ValidationError(
          'assign-invoice-tag-activity',
          `Cannot assign tag ${tag.key} activity to invoice ${invoice.id} because no note details were provided`,
        );
      }
      this.appendActivityLog(
        invoice,
        tag,
        changeAction.noteDetails,
        groupId,
        changeAction.activityId,
      );
    }
  }

  private getTag(changeAction: ChangeAction, invoice: InvoiceEntity) {
    if (!changeAction.key) {
      this.logger.error(
        'Cannot assign tag activity because no key was provided',
        {
          loadNumber: invoice.loadNumber,
        },
      );
      throw new ValidationError(
        'assign-invoice-tag-activity',
        `Cannot assign tag activity on invoice ${invoice.id} because no key was provided`,
      );
    }
    return this.tagDefinitionRepository.getByKey(changeAction.key);
  }

  private async getAssignmentAction(
    invoice: InvoiceEntity,
    tag: TagDefinitionEntity,
    changeAction: ChangeAction,
  ): Promise<AssignmentAction> {
    if (
      [
        TagDefinitionKey.NOTE,
        TagDefinitionKey.NOTIFICATION,
        TagDefinitionKey.PROCESSING,
      ].includes(tag.key)
    ) {
      return AssignmentAction.OnlyActivity;
    }

    if (invoiceContainsActiveTag(invoice, tag)) {
      if (this.featureFlagResolver.isEnabled(FeatureFlag.TagReassignment)) {
        this.logger.debug('Tagging invoice with an existing tag', {
          invoiceId: invoice.id,
          tag: tag.key,
        });
        return AssignmentAction.TagAndActivity;
      }

      if (
        // If an invoice is automatically tagged with a tag from rejection reasons
        // when we reject that invoice, if we select the same tag
        // we should be able to assign the activity log only
        await this.invoiceTagAssignmentValidationService.anyTagIsPartOfAnyGroup(
          [tag],
          [TagDefinitionGroupKey.REJECTION_REASONS],
        )
      ) {
        return AssignmentAction.OnlyActivity;
      }
      if (changeAction.properties.optional) {
        this.logger.warn(
          'Invoice is already tagged and the assignment is skipped because it is optional',
          {
            invoiceId: invoice.id,
            tag: tag.key,
          },
        );
        return AssignmentAction.None;
      }

      this.logger.error(`Invoice already contains tag. Cannot reassign`, {
        invoiceId: invoice.id,
        tag: tag.key,
      });
      throw new ValidationError(
        'assign-invoice-tag',
        `Invoice ${invoice.id} already contains tag ${tag.key}`,
      );
    }

    try {
      await this.invoiceTagAssignmentValidationService.validate([invoice, tag]);
      return AssignmentAction.TagAndActivity;
    } catch (error) {
      this.logger.error(
        'Assignment action set to none because validation failed',
        {
          error: error.message,
          invoiceId: invoice.id,
          tag: tag.key,
        },
      );
      return AssignmentAction.None;
    }
  }

  private appendTag(
    invoice: InvoiceEntity,
    tag: TagDefinitionEntity,
    actor: ChangeActor,
  ): void {
    this.logger.debug('Assigning tag to invoice', {
      invoiceId: invoice.id,
      loadNumber: invoice.loadNumber,
      tag: tag.key,
    });

    const invoiceTagActivity = new InvoiceTagEntity();
    invoiceTagActivity.invoice = invoice;
    invoiceTagActivity.tagDefinition = tag;
    invoiceTagActivity.assignedByType =
      actor === ChangeActor.System ? UsedByType.System : UsedByType.User;
    invoice.tags.add(invoiceTagActivity);
  }

  private appendActivityLog(
    invoice: InvoiceEntity,
    tag: TagDefinitionEntity,
    noteDetails: Note,
    groupId: string,
    activityId: null | string,
  ): void {
    this.logger.debug('Assigning activity to invoice', {
      invoiceId: invoice.id,
      loadNumber: invoice.loadNumber,
      tag: tag.key,
    });

    const activityLog = new ActivityLogEntity();
    if (activityId) {
      activityLog.id = activityId;
    }
    activityLog.tagDefinition = tag;
    activityLog.note = this.buildNote(tag, noteDetails);
    activityLog.payload = noteDetails.payload;
    activityLog.groupId = groupId;
    invoice.activities.add(activityLog);
  }

  private buildNote(tag: TagDefinitionEntity, noteDetails: Note): string {
    if (noteDetails.hasText()) {
      return noteDetails.getText();
    }

    if (tag.notePlaceholders) {
      return noteDetails.getPlaceholderAwareNote(
        tag.note,
        tag.notePlaceholders,
      );
    }

    return tag.note;
  }
}
