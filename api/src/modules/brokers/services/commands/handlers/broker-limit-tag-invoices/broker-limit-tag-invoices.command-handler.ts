import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { Arrays } from '@core/util';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  BrokerFactoringConfigRepository,
  InvoiceEntity,
  InvoiceRepository,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { BrokerLimitTagInvoiceCommand } from '../../broker-limit-tag-invoices.command';

@CommandHandler(BrokerLimitTagInvoiceCommand)
export class BrokerLimitTagInvoicesCommandHandler
  implements BasicCommandHandler<BrokerLimitTagInvoiceCommand>
{
  private logger: Logger = new Logger(
    BrokerLimitTagInvoicesCommandHandler.name,
  );

  constructor(
    private invoiceRepository: InvoiceRepository,
    private brokerFactoringConfigRepository: BrokerFactoringConfigRepository,
    private invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  async execute({ brokerId }: BrokerLimitTagInvoiceCommand): Promise<void> {
    const limitAmountRaw =
      await this.brokerFactoringConfigRepository.getOneByBrokerId(brokerId);

    const limitAmount = limitAmountRaw?.limitAmount
      ? new Big(limitAmountRaw.limitAmount)
      : new Big(0);

    const amount = await this.invoiceRepository.getTotalAmountUnpaidByBroker(
      brokerId,
    );

    const invoices = await this.invoiceRepository.find({
      brokerId,
      status: InvoiceStatus.UnderReview,
    });

    if (limitAmount.eq(0) || limitAmount.gt(amount)) {
      this.logger.debug(
        `Broker limit is zero or greater than the amount. Untagging invoices`,
        {
          brokerId,
          limitAmount: limitAmount.toFixed(),
          amount: amount.toFixed(),
        },
      );
      await this.untagInvoices(invoices);
      return;
    }

    this.logger.debug(
      `Broker limit is less than the amount. Tagging invoices`,
      {
        brokerId,
        limitAmount: limitAmount.toFixed(),
        amount: amount.toFixed(),
      },
    );
    await this.tagInvoices(limitAmount, new Big(amount), invoices);
  }

  private async untagInvoices(invoices: InvoiceEntity[]) {
    const taggedInvoices = await Arrays.filterAsync(invoices, async (invoice) =>
      InvoiceEntityUtil.isTagged(
        invoice,
        TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
      ),
    );

    for (const invoice of taggedInvoices) {
      await this.invoiceChangeActionsExecutor.apply(
        invoice,
        ChangeActions.deleteTag(TagDefinitionKey.BROKER_LIMIT_EXCEEDED),
      );
    }
  }

  private async tagInvoices(
    limitAmount: Big,
    arAmount: Big,
    invoices: InvoiceEntity[],
  ) {
    const untaggedInvoices = await Arrays.filterAsync(
      invoices,
      async (invoice) =>
        !(await InvoiceEntityUtil.isTagged(
          invoice,
          TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
        )),
    );
    for (const invoice of untaggedInvoices) {
      await this.invoiceChangeActionsExecutor.apply(
        invoice,
        ChangeActions.addTagAndActivity(
          TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
          Note.from({
            payload: {
              brokerLimitAmount: limitAmount.toFixed(),
              arAmount: arAmount.toFixed(),
            },
          }),
        ),
      );
    }
  }
}
