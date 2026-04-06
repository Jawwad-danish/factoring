import { transferableAmount } from '@core/formulas';
import { BasicQueryHandler } from '@module-cqrs';
import { InvoiceEntity, ReserveEntity } from '@module-persistence/entities';
import {
  UpcomingRegularClientAmount,
  UpcomingRegularTransfer,
} from '@module-transfers/data';
import { Logger } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { FindUpcomingRegularTransfersQuery } from '../../find-upcoming-regular-transfers.query';
import { TransferTime, TransferTimeService } from '@module-common';
import { TransferDataAccess } from '../../../commands';
import { getCurrentUTCDate } from '@core/date-time';

@QueryHandler(FindUpcomingRegularTransfersQuery)
export class FindUpcomingRegularTransfersQueryHandler
  implements BasicQueryHandler<FindUpcomingRegularTransfersQuery>
{
  private logger = new Logger(FindUpcomingRegularTransfersQueryHandler.name);

  constructor(
    private readonly transferTimeService: TransferTimeService,
    private readonly transfersDataAccess: TransferDataAccess,
  ) {}

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: FindUpcomingRegularTransfersQuery,
  ): Promise<UpcomingRegularTransfer> {
    const currentDate = getCurrentUTCDate().toDate();
    const currentTransferWindow =
      this.transferTimeService.getCurrentTransferWindow(currentDate, 10);

    const clientsInvoices = await this.handleRegularInvoices(
      this.shouldIncludeExpedited(currentTransferWindow),
    );
    const clientsReserves = await this.getReleaseOfFunds();
    let transferTotal = Big(0);
    let purchasedInvoicesCount = 0;
    let releaseOfFundsCount = 0;
    const clientAmounts: UpcomingRegularClientAmount[] = [];
    const allClientIds = new Set([
      ...Array.from(clientsInvoices.keys()),
      ...Array.from(clientsReserves.keys()),
    ]);
    for (const clientId of allClientIds) {
      const invoices = clientsInvoices.get(clientId) || [];
      const reserves = clientsReserves.get(clientId) || [];

      // Skip if client has neither invoices nor reserves
      if (!invoices.length && !reserves.length) {
        this.logger.warn('Client has neither invoices nor reserves', {
          clientId: clientId,
        });
        continue;
      }
      releaseOfFundsCount += reserves.length;
      purchasedInvoicesCount += invoices.length;

      const clientUpcomingAmount = this.getClientUpcomingAmount(
        clientId,
        invoices,
        reserves,
      );
      clientAmounts.push(clientUpcomingAmount);
      transferTotal = transferTotal.plus(clientUpcomingAmount.transferable);
    }
    return new UpcomingRegularTransfer({
      clientAmounts: clientAmounts,
      purchasedInvoicesCount: purchasedInvoicesCount,
      reservesCount: releaseOfFundsCount,
      transferTime: this.transferTimeService.getNextTransferTime(new Date()),
      totalAmount: transferTotal,
    });
  }

  private async handleRegularInvoices(
    includeExpedited: boolean,
  ): Promise<Map<string, InvoiceEntity[]>> {
    const regularInvoices =
      await this.transfersDataAccess.getInvoicesForRegularTransfer(
        includeExpedited,
      );

    //need to filter out any clients with upcoming expedites
    const expediteInvoices = await this.transfersDataAccess.expediteClients();
    const invoices = regularInvoices.filter((invoice) => {
      return !expediteInvoices.includes(invoice.clientId);
    });

    const map: Map<string, InvoiceEntity[]> = new Map<
      string,
      InvoiceEntity[]
    >();

    for (const invoice of invoices) {
      if (!map.has(invoice.clientId)) {
        map.set(invoice.clientId, []);
      }
      map.get(invoice.clientId)?.push(invoice);
    }
    return map;
  }

  private async getReleaseOfFunds(): Promise<Map<string, ReserveEntity[]>> {
    const reserves = await this.transfersDataAccess.getReleaseOfFunds();
    const map: Map<string, ReserveEntity[]> = new Map<
      string,
      ReserveEntity[]
    >();

    for (const reserve of reserves) {
      if (!map.has(reserve.clientId)) {
        map.set(reserve.clientId, []);
      }
      map.get(reserve.clientId)?.push(reserve);
    }
    return map;
  }

  private getClientUpcomingAmount(
    clientId: string,
    invoices: InvoiceEntity[],
    reserves: ReserveEntity[],
  ): UpcomingRegularClientAmount {
    const clientReservesTotal = reserves
      .reduce((total, curr) => total.plus(curr.amount), new Big(0))
      .times(-1);
    const invoicesTotal = transferableAmount(invoices);
    const clientTransferAmount = invoicesTotal.plus(clientReservesTotal);
    const upcomingAmount = new UpcomingRegularClientAmount();
    upcomingAmount.clientId = clientId;
    upcomingAmount.fee = new Big(0);
    upcomingAmount.invoicesTotal = invoicesTotal;
    upcomingAmount.reservesTotal = clientReservesTotal;
    upcomingAmount.transferable = clientTransferAmount;
    return upcomingAmount;
  }

  private shouldIncludeExpedited(
    transferTimeWindow: TransferTime | null,
  ): boolean {
    // include expedited only if we're inside the last transfer window of the day (second ach)
    if (transferTimeWindow === null) {
      return false;
    }
    return (
      this.transferTimeService.getLastTransferTimeOfTheDay().name ===
      transferTimeWindow.name
    );
  }
}
