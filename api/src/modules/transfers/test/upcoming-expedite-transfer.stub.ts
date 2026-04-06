import Big from 'big.js';

import { UUID } from '@core/uuid';
import { UpcomingExpediteTransfer } from '../data/upcoming-expedite-transfer.model';
import { UpcomingAmount } from '../data/upcoming-amount.model';

export const buildStubUpcomingExpediteTransfer = (
  data?: Partial<UpcomingExpediteTransfer>,
): UpcomingExpediteTransfer => {
  const transfer = new UpcomingExpediteTransfer();
  transfer.clientId = UUID.get();
  transfer.amount = new UpcomingAmount({
    fee: new Big(0),
    invoicesTotal: new Big(0),
    transferable: new Big(0),
  });
  transfer.underReviewInvoicesCount = 0;
  transfer.purchasedInvoicesCount = 0;
  transfer.doneSubmittingInvoices = true;
  Object.assign(transfer, data);
  return transfer;
};
