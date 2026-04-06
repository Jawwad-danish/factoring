import { ChangeAction, ChangeSubject } from '@common';
import { ValidationError } from '@core/validation';
import {
  ActivityLogEntity,
  InvoiceEntity,
  RecordStatus,
  TagDefinitionEntity,
  TagDefinitionRepository,
  TagStatus,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import { findActiveInvoiceTag } from './util';
import { Note } from '@core/data';

@Injectable()
export class ChangeActionDeleteOperationHandler {
  private logger = new Logger(ChangeActionDeleteOperationHandler.name);

  constructor(
    private readonly tagDefinitionRepository: TagDefinitionRepository,
  ) {}

  async handle(
    changeAction: ChangeAction,
    invoice: InvoiceEntity,
    groupId: string,
  ) {
    const shouldDeleteTag = [
      ChangeSubject.Tag,
      ChangeSubject.TagActivity,
    ].includes(changeAction.properties.subject);
    const shouldDeleteActivity = [
      ChangeSubject.Activity,
      ChangeSubject.TagActivity,
    ].includes(changeAction.properties.subject);
    let tag: TagDefinitionEntity;

    if (changeAction.activityId && shouldDeleteActivity) {
      const activity = invoice.activities.find(
        (activity) =>
          activity.id === changeAction.activityId &&
          activity.recordStatus === RecordStatus.Active,
      );
      if (!activity) {
        this.logger.error(
          `Cannot delete activity because it does not exist on this invoice`,
          {
            invoiceId: invoice.id,
            activityId: changeAction.activityId,
            optional: changeAction.properties.optional,
          },
        );
        if (!changeAction.properties.optional) {
          throw new ValidationError(
            'delete-invoice-tag-activity',
            `Cannot delete activity with id ${changeAction.activityId} because it does not exist on invoice with id ${invoice.id}`,
          );
        }
        return;
      }
      activity.recordStatus = RecordStatus.Inactive;
      tag = activity.tagDefinition;
    } else {
      tag = await this.getTag(changeAction, invoice);
    }

    if (shouldDeleteTag) {
      const found = findActiveInvoiceTag(invoice, tag);
      if (found) {
        found.recordStatus = RecordStatus.Inactive;
        if (changeAction.properties.trackDeletion) {
          this.appendActivityLog(
            invoice,
            tag,
            groupId,
            changeAction.noteDetails,
          );
        }
      }
      // We can have only activity entries with no tags (ie. NOTE)
      if (
        !found &&
        !shouldDeleteActivity &&
        !changeAction.properties.optional
      ) {
        this.logger.error(
          `Cannot delete tag because it does not exist on this invoice`,
          {
            invoiceId: invoice.id,
            tag: tag.key,
          },
        );
        throw new ValidationError(
          'delete-invoice-tag-activity',
          `Cannot delete tag ${tag.key} because it does not exist on invoice ${invoice.id}`,
        );
      }
    }
  }

  private getTag(changeAction: ChangeAction, invoice: InvoiceEntity) {
    if (!changeAction.key) {
      this.logger.error(
        'Cannot delete tag activity because no key was provided',
        {
          loadNumber: invoice.loadNumber,
        },
      );
      throw new ValidationError(
        'delete-invoice-tag-activity',
        'Cannot delete tag activity because no key was provided',
      );
    }
    return this.tagDefinitionRepository.getByKey(changeAction.key);
  }

  private appendActivityLog(
    invoice: InvoiceEntity,
    tag: TagDefinitionEntity,
    groupId: string,
    note: null | Note,
  ): void {
    this.logger.debug('Assigning activity to invoice', {
      invoiceId: invoice.id,
      loadNumber: invoice.loadNumber,
      tag: tag.key,
    });

    const activityLog = new ActivityLogEntity();
    activityLog.tagDefinition = tag;
    activityLog.note =
      note?.getText() == null ? `Deleted tag ${tag.name}` : note.getText();
    activityLog.payload = {};
    activityLog.groupId = groupId;
    activityLog.tagStatus = TagStatus.Inactive;
    invoice.activities.add(activityLog);
  }
}
