import { ChangeActions } from '@common';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { QueryRunner } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceEntity, TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommandInvoiceContext,
  InvoiceContext,
  InvoiceMapper,
} from '../../../../data';
import { CreateInvoiceCommand } from '../../create-invoice.command';
import { BaseInvoiceCommandHandler } from '../base-invoice.command-handler';
import { CreateInvoiceRuleService } from './rules';
import { CreateInvoiceValidationService } from './validation';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceCommandHandler
  extends BaseInvoiceCommandHandler<CreateInvoiceRequest, CreateInvoiceCommand>
  implements ICommandHandler<CreateInvoiceCommand, InvoiceContext>
{
  constructor(
    readonly queryRunner: QueryRunner,
    readonly invoiceRepository: InvoiceRepository,
    readonly validationService: CreateInvoiceValidationService,
    readonly ruleService: CreateInvoiceRuleService,
    readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    readonly mapper: InvoiceMapper,
  ) {
    super(
      queryRunner,
      invoiceRepository,
      validationService,
      ruleService,
      invoiceChangeActionsExecutor,
    );
  }
  protected loadEntity(command: CreateInvoiceCommand): Promise<InvoiceEntity> {
    return this.mapper.createRequestToEntity(command.request);
  }

  async prepareContext(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: CommandInvoiceContext<CreateInvoiceRequest>,
  ): Promise<ChangeActions> {
    return ChangeActions.addTag(TagDefinitionKey.INVOICE_PDF_IN_PROGRESS);
  }
}
