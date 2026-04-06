import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { Arrays } from '@core/util';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  InvoiceEntity,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  InvoiceRepository,
} from '@module-persistence/repositories';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { ClientLimitTagInvoicesCommand } from '../../client-limit-tag-invoices.command';

@CommandHandler(ClientLimitTagInvoicesCommand)
export class ClientLimitTagInvoicesCommandHandler
  implements BasicCommandHandler<ClientLimitTagInvoicesCommand>
{
  private logger = new Logger(ClientLimitTagInvoicesCommandHandler.name);

  constructor(
    private invoiceRepository: InvoiceRepository,
    private clientFactoringConfigRepository: ClientFactoringConfigsRepository,
    private invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  async execute({ clientId }: ClientLimitTagInvoicesCommand): Promise<void> {
    const { clientLimitAmount } =
      await this.clientFactoringConfigRepository.getOneByClientId(clientId);
    if (clientLimitAmount == null) {
      this.logger.debug(`Client limit is not defined for client`, {
        clientId,
      });
      return;
    }

    const arAmount =
      await this.invoiceRepository.getLast30DaysTotalARUnpaidByClient(clientId);

    const invoices = await this.invoiceRepository.find({
      clientId,
      status: InvoiceStatus.UnderReview,
    });

    if (clientLimitAmount.gt(arAmount)) {
      this.logger.log(`Not marking invoices with CLIENT_LIMIT_EXCEEDED tag`, {
        clientId,
        clientLimitAmount: clientLimitAmount.toFixed(),
        arAmount: arAmount.toFixed(),
      });
      await this.untagInvoices(invoices);
    } else if (clientLimitAmount.lt(arAmount)) {
      this.logger.log(`Marking invoices with CLIENT_LIMIT_EXCEEDED tag`, {
        clientId,
        clientLimitAmount: clientLimitAmount.toFixed(),
        arAmount: arAmount.toFixed(),
      });
      await this.tagInvoices(clientLimitAmount, new Big(arAmount), invoices);
    }
  }

  private async untagInvoices(invoices: InvoiceEntity[]) {
    const taggedInvoices = await Arrays.filterAsync(invoices, async (invoice) =>
      InvoiceEntityUtil.isTagged(
        invoice,
        TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
      ),
    );

    for (const invoice of taggedInvoices) {
      await this.invoiceChangeActionsExecutor.apply(
        invoice,
        ChangeActions.deleteTag(TagDefinitionKey.CLIENT_LIMIT_EXCEEDED),
      );
    }
  }

  private async tagInvoices(
    clientLimitAmount: Big,
    arAmount: Big,
    invoices: InvoiceEntity[],
  ) {
    const untaggedInvoices = await Arrays.filterAsync(
      invoices,
      async (invoice) =>
        !(await InvoiceEntityUtil.isTagged(
          invoice,
          TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
        )),
    );
    for (const invoice of untaggedInvoices) {
      await this.invoiceChangeActionsExecutor.apply(
        invoice,
        ChangeActions.addTagAndActivity(
          TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
          Note.from({
            payload: {
              clientLimitAmount: clientLimitAmount.toFixed(),
              arAmount: arAmount.toFixed(),
            },
          }),
        ),
      );
    }
  }
}
