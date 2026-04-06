import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientPaymentStatus,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { UpdateInvoiceExpeditedCommand } from '../../update-invoice-expedited.command';
import { payableAmount } from '@core/formulas';
import { ExpediteConfigurer } from '@module-common';

@CommandHandler(UpdateInvoiceExpeditedCommand)
export class UpdateInvoiceExpeditedCommandHandler
  implements BasicCommandHandler<UpdateInvoiceExpeditedCommand>
{
  constructor(
    private invoiceRepository: InvoiceRepository,
    private invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly expediteConfigurer: ExpediteConfigurer,
  ) {}

  async execute(command: UpdateInvoiceExpeditedCommand): Promise<void> {
    const [invoices] = await this.invoiceRepository.findAll({
      clientId: command.request.clientId,
      status: [InvoiceStatus.UnderReview, InvoiceStatus.Purchased],
      clientPaymentStatus: [
        ClientPaymentStatus.NotApplicable,
        ClientPaymentStatus.Pending,
      ],
    });

    for (const invoice of invoices) {
      let changeInvoiceTransferType = true;
      const proposedAmountToPay = payableAmount({
        accountsReceivableValue: invoice.accountsReceivableValue,
        reserveFee: invoice.reserveFee,
        approvedFactorFee: invoice.approvedFactorFee,
        deduction: invoice.deduction,
      });
      if (
        command.request.expedite &&
        invoice.status === InvoiceStatus.UnderReview &&
        invoice.value.lt(this.expediteConfigurer.expediteFee())
      ) {
        changeInvoiceTransferType = false;
      }
      if (
        command.request.expedite &&
        invoice.status === InvoiceStatus.Purchased &&
        proposedAmountToPay.lt(this.expediteConfigurer.expediteFee())
      ) {
        changeInvoiceTransferType = false;
      }

      if (changeInvoiceTransferType) {
        invoice.expedited = command.request.expedite;
        const toText = command.request.expedite ? 'Expedite' : 'ACH';
        await this.invoiceChangeActionsExecutor.apply(
          invoice,
          ChangeActions.addActivity(
            TagDefinitionKey.UPDATE_INVOICE,
            Note.fromText(`Changed invoice transfer type to ${toText}.`),
          ),
        );
      }
    }
  }
}
