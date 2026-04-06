import { ChangeActions, ChangeOperation } from '@common';
import {
  InvoiceEntity,
  TagDefinitionEntity,
  TagDefinitionGroupKey,
} from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { UUID } from '@core/uuid';
import { InvoiceTagAssignmentValidationService } from '../validation';
import { ChangeActionAssignOperationHandler } from './change-action-assign-operation-handler';
import { ChangeActionDeleteOperationHandler } from './change-action-delete-operation-handler';

@Injectable()
export class InvoiceChangeActionsExecutor {
  constructor(
    private assignOperationHandler: ChangeActionAssignOperationHandler,
    private deleteOperationHandler: ChangeActionDeleteOperationHandler,
    private invoiceTagAssignmentValidationService: InvoiceTagAssignmentValidationService,
  ) {}

  async areTagsAssociatedWithGroups(
    tags: TagDefinitionEntity[],
    keys: TagDefinitionGroupKey[],
  ): Promise<boolean> {
    return this.invoiceTagAssignmentValidationService.anyTagIsPartOfAnyGroup(
      tags,
      keys,
    );
  }

  async apply(
    invoice: InvoiceEntity,
    changeActions: ChangeActions,
  ): Promise<void> {
    const groupId = UUID.get();
    for (const action of changeActions.actions) {
      if (action.properties.operation === ChangeOperation.Assign) {
        await this.assignOperationHandler.handle(action, invoice, groupId);
      }
      if (action.properties.operation === ChangeOperation.Delete) {
        await this.deleteOperationHandler.handle(action, invoice, groupId);
      }
    }
  }
}
