import { QueryRunner } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  InvoiceEntity,
  InvoiceStatus,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommandInvoiceContext,
  InvoiceContext,
  RejectInvoiceRequest,
} from '../../../../data';
import { BaseInvoiceCommandHandler } from '../base-invoice.command-handler';

import { ChangeActions } from '@common';
import { getDateInBusinessTimezone } from '@core/date-time';

import { RejectInvoiceCommand } from '../../reject-invoice.command';
import { InvoiceAssigner } from '../common';
import { RejectInvoiceRuleService } from './rules';
import { RejectInvoiceValidationService } from './validation';

@CommandHandler(RejectInvoiceCommand)
export class RejectInvoiceCommandHandler
  extends BaseInvoiceCommandHandler<RejectInvoiceRequest, RejectInvoiceCommand>
  implements ICommandHandler<RejectInvoiceCommand, InvoiceContext>
{
  constructor(
    readonly queryRunner: QueryRunner,
    readonly invoiceRepository: InvoiceRepository,
    readonly validationService: RejectInvoiceValidationService,
    readonly ruleService: RejectInvoiceRuleService,
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
  protected loadEntity(command: RejectInvoiceCommand): Promise<InvoiceEntity> {
    return this.invoiceRepository.getOneById(command.invoiceId);
  }

  async prepareContext(
    context: CommandInvoiceContext<RejectInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity } = context;
    const updatePayload = {
      status: InvoiceStatus.Rejected,
      verificationStatus: VerificationStatus.Failed,
      rejectedDate: getDateInBusinessTimezone().toDate(),
    };
    return this.invoiceAssigner.apply(
      entity,
      updatePayload,
      TagDefinitionKey.REJECT_INVOICE,
    );
  }
}
