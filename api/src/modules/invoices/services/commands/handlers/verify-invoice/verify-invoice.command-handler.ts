import { QueryRunner } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  InvoiceEntity,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommandInvoiceContext,
  InvoiceContext,
  VerifyInvoiceRequest,
} from '../../../../data';
import { BaseInvoiceCommandHandler } from '../base-invoice.command-handler';

import { ActivityLogPayloadBuilder, ChangeActions, ChangeActor } from '@common';

import { Note } from '@core/data';
import { Logger } from '@nestjs/common';
import { VerifyInvoiceCommand } from '../../verify-invoice.command';
import { VerifyInvoiceRuleService } from './rules';
import { VerifyInvoiceValidationService } from './validation';

@CommandHandler(VerifyInvoiceCommand)
export class VerifyInvoiceCommandHandler
  extends BaseInvoiceCommandHandler<VerifyInvoiceRequest, VerifyInvoiceCommand>
  implements ICommandHandler<VerifyInvoiceCommand, InvoiceContext>
{
  private readonly logger = new Logger(VerifyInvoiceCommandHandler.name);

  constructor(
    readonly queryRunner: QueryRunner,
    readonly invoiceRepository: InvoiceRepository,
    readonly validationService: VerifyInvoiceValidationService,
    readonly ruleService: VerifyInvoiceRuleService,
    readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {
    super(
      queryRunner,
      invoiceRepository,
      validationService,
      ruleService,
      invoiceChangeActionsExecutor,
    );
  }
  protected loadEntity(command: VerifyInvoiceCommand): Promise<InvoiceEntity> {
    return this.invoiceRepository.getOneById(command.invoiceId);
  }

  async prepareContext(
    context: CommandInvoiceContext<VerifyInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity, payload } = context;
    const { status, contactPerson, contactType } = payload;
    entity.verificationStatus = status;
    const tagKey =
      status === VerificationStatus.InProgress
        ? TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION
        : TagDefinitionKey.VERIFY_INVOICE;

    const note = Note.from({
      payload: ActivityLogPayloadBuilder.forKey(tagKey, {
        data: {
          contactPerson,
          contactType,
          status,
        },
      }),
      text: `Talked to ${contactPerson} on ${contactType}. ${payload.notes}`,
    });

    const actor = ChangeActor.User;

    if (tagKey === TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION) {
      this.logger.debug(`Adding tag and activity for tag ${tagKey}`);
      return ChangeActions.addTagAndActivity(tagKey, note, { actor });
    }

    this.logger.debug(`Adding activity for tag ${tagKey}`);
    return ChangeActions.addActivity(tagKey, note, { actor });
  }
}
