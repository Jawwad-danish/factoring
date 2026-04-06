import { BasicQueryHandler } from '@module-cqrs';
import {
  ClientPaymentStatus,
  InvoiceStatus,
} from '@module-persistence/entities';
import { QueryHandler } from '@nestjs/cqrs';
import {
  endOfDay,
  getDateInBusinessTimezone,
  startOfDay,
} from '@core/date-time';
import { PurchaseVolume } from '../../../../data';
import { GetPurchaseVolumeQuery } from '../../get-purchase-volume.query';
import { InvoiceDataAccess } from '../../../invoice-data-access';

const paidClientPayments = [
  ClientPaymentStatus.Sent,
  ClientPaymentStatus.Completed,
];

@QueryHandler(GetPurchaseVolumeQuery)
export class GetPurchaseVolumeQueryHandler
  implements BasicQueryHandler<GetPurchaseVolumeQuery>
{
  constructor(private readonly invoiceDataAccess: InvoiceDataAccess) {}

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetPurchaseVolumeQuery,
  ): Promise<PurchaseVolume> {
    const today = getDateInBusinessTimezone();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const purchasedUnpaid = await this.invoiceDataAccess.getPurchaseVolume({
      status: InvoiceStatus.Purchased,
      clientPaymentStatus: {
        $nin: paidClientPayments,
      },
      purchasedDate: {
        $gte: startOfToday.toDate(),
        $lte: endOfToday.toDate(),
      },
    });
    const purchasedPaid = await this.invoiceDataAccess.getPurchaseVolume({
      status: InvoiceStatus.Purchased,
      clientPaymentStatus: {
        $in: paidClientPayments,
      },
      purchasedDate: {
        $gte: startOfToday.toDate(),
        $lte: endOfToday.toDate(),
      },
    });
    return new PurchaseVolume({
      purchasedUnpaid,
      purchasedPaid,
    });
  }
}
