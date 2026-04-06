import { QueryRunner } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceEntity, TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommandInvoiceContext,
  InvoiceContext,
  InvoiceMapper,
  UpdateInvoiceRequest,
} from '../../../../data';
import { UpdateInvoiceCommand } from '../../update-invoice.command';
import { BaseInvoiceCommandHandler } from '../base-invoice.command-handler';

import {
  ChangeActions,
  isValidClientPaymentStatusForEditing as isValidClientPaymentStatusForEmailResend,
} from '@common';
import { DocumentsProcessor } from '@module-invoices';
import { InvoiceAssigner } from '../common';
import { UpdateInvoiceRuleService } from './rules';
import { UpdateInvoiceValidationService } from './validation';

@CommandHandler(UpdateInvoiceCommand)
export class UpdateInvoiceCommandHandler
  extends BaseInvoiceCommandHandler<UpdateInvoiceRequest, UpdateInvoiceCommand>
  implements ICommandHandler<UpdateInvoiceCommand, InvoiceContext>
{
  constructor(
    readonly queryRunner: QueryRunner,
    readonly invoiceRepository: InvoiceRepository,
    readonly validationService: UpdateInvoiceValidationService,
    readonly ruleService: UpdateInvoiceRuleService,
    readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    readonly mapper: InvoiceMapper,
    private invoiceAssigner: InvoiceAssigner,
    private documentsProcessor: DocumentsProcessor,
  ) {
    super(
      queryRunner,
      invoiceRepository,
      validationService,
      ruleService,
      invoiceChangeActionsExecutor,
    );
  }
  protected loadEntity(command: UpdateInvoiceCommand): Promise<InvoiceEntity> {
    return this.invoiceRepository.getOneById(command.invoiceId);
  }

  async prepareContext(
    context: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity, payload } = context;
    const preRuleResult = await this.invoiceAssigner.apply(entity, payload);
    if (
      payload.documents &&
      (payload.documents?.toAdd.length > 0 ||
        payload.documents?.toUpdate.length > 0)
    ) {
      preRuleResult.concat(
        ChangeActions.addTag(TagDefinitionKey.INVOICE_PDF_IN_PROGRESS, {
          optional: true,
        }),
      );
    }
    preRuleResult.concat(
      ChangeActions.deleteTag(TagDefinitionKey.INVOICE_PDF_FAILURE, {
        optional: true,
      }),
    );

    return preRuleResult;
  }

  async postSaveHooks(
    context: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<void> {
    let sendDocumentAfterProcessing = false;
    if (
      isValidClientPaymentStatusForEmailResend(
        context.entity.clientPaymentStatus,
      )
    ) {
      sendDocumentAfterProcessing = context.payload.resendEmail ?? false;
    }

    await this.documentsProcessor.sendToProcess(
      context,
      sendDocumentAfterProcessing,
    );
  }
}
