import { ChangeActions, ChangeActor } from '@common';
import { Assignment, Note } from '@core/data';
import { getCurrentUTCDate } from '@core/date-time';
import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { QueryRunner } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientPaymentStatus,
  InvoiceEntity,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import {
  CommandInvoiceContext,
  InvoiceContext,
  InvoiceMapper,
  PurchaseInvoiceRequest,
} from '../../../../data';
import { PurchaseInvoiceCommand } from '../../purchase-invoice.command';
import { BaseInvoiceCommandHandler } from '../base-invoice.command-handler';
import { InvoiceAssigner } from '../common';
import { calculateFees } from './amounts';
import { PurchaseInvoiceRuleService } from './rules';
import { PurchaseInvoiceValidationService } from './validation';

@CommandHandler(PurchaseInvoiceCommand)
export class PurchaseInvoiceCommandHandler
  extends BaseInvoiceCommandHandler<
    PurchaseInvoiceRequest,
    PurchaseInvoiceCommand
  >
  implements ICommandHandler<PurchaseInvoiceCommand, InvoiceContext>
{
  constructor(
    readonly queryRunner: QueryRunner,
    readonly invoiceRepository: InvoiceRepository,
    readonly validationService: PurchaseInvoiceValidationService,
    readonly ruleService: PurchaseInvoiceRuleService,
    readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    readonly mapper: InvoiceMapper,
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
  protected loadEntity(
    command: PurchaseInvoiceCommand,
  ): Promise<InvoiceEntity> {
    return this.invoiceRepository.getOneById(command.invoiceId);
  }

  async prepareContext({
    client,
    entity,
    payload,
  }: CommandInvoiceContext<PurchaseInvoiceRequest>): Promise<ChangeActions> {
    const {
      reserveRatePercentage,
      reserveFee,
      approvedFactorFeePercentage,
      approvedFactorFee,
    } = calculateFees(entity, client.factoringConfig);

    const updatePayload = {
      ...payload,
      status: InvoiceStatus.Purchased,
      purchasedDate: getCurrentUTCDate().toDate(),
      accountsReceivableValue: entity.value,
      clientPaymentStatus: entity.buyout
        ? ClientPaymentStatus.Sent
        : ClientPaymentStatus.Pending,
      reserveFee,
      reserveRatePercentage,
      approvedFactorFeePercentage,
      approvedFactorFee,
    };

    let changeActions = ChangeActions.empty();

    if (payload.deduction && payload.deduction > Big(0)) {
      const assignmentResult = Assignment.assign(
        updatePayload,
        'deduction',
        updatePayload.deduction,
      );

      const activityChangeActions = ChangeActions.addActivity(
        TagDefinitionKey.UPDATE_INVOICE,
        Note.from({
          payload: assignmentResult.getPayload(),
          text: `Approved for ${formatToDollars(
            penniesToDollars(entity.value),
          )} (deduction of ${formatToDollars(
            penniesToDollars(payload.deduction),
          )} taken from original total) via wire.`,
        }),
        { actor: ChangeActor.User },
      );

      changeActions = changeActions.concat(activityChangeActions);
    }

    const assignerChangeActions = await this.invoiceAssigner.apply(
      entity,
      updatePayload,
      TagDefinitionKey.PURCHASE_INVOICE,
    );
    return changeActions.concat(assignerChangeActions);
  }
}
