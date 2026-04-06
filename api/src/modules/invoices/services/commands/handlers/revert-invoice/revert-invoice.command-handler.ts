import { QueryRunner } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  CommandInvoiceContext,
  InvoiceContext,
  RevertInvoiceRequest,
} from '@module-invoices/data';
import {
  InvoiceEntity,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseInvoiceCommandHandler } from '../base-invoice.command-handler';

import { ChangeActions } from '@common';

import { RevertInvoiceCommand } from '../../revert-invoice.command';
import { InvoiceAssigner, UpdateInvoiceModel } from '../common';
import { RevertInvoiceRuleService } from './rules';
import { RevertInvoiceValidationService } from './validation';

@CommandHandler(RevertInvoiceCommand)
export class RevertInvoiceCommandHandler
  extends BaseInvoiceCommandHandler<RevertInvoiceRequest, RevertInvoiceCommand>
  implements ICommandHandler<RevertInvoiceCommand, InvoiceContext>
{
  constructor(
    readonly queryRunner: QueryRunner,
    readonly invoiceRepository: InvoiceRepository,
    readonly validationService: RevertInvoiceValidationService,
    readonly ruleService: RevertInvoiceRuleService,
    readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private invoiceAssigner: InvoiceAssigner,
  ) {
    super(
      queryRunner,
      invoiceRepository,
      validationService,
      ruleService,
      invoiceChangeActionsExecutor,
    );
  }
  protected loadEntity(command: RevertInvoiceCommand): Promise<InvoiceEntity> {
    return this.invoiceRepository.getOneById(command.invoiceId);
  }

  async prepareContext({
    entity,
  }: CommandInvoiceContext<RevertInvoiceRequest>): Promise<ChangeActions> {
    const updatePayload: UpdateInvoiceModel = {
      status: InvoiceStatus.UnderReview,
      purchasedDate: null,
    };
    return this.invoiceAssigner.apply(
      entity,
      updatePayload,
      TagDefinitionKey.REVERT_INVOICE,
    );
  }
}
