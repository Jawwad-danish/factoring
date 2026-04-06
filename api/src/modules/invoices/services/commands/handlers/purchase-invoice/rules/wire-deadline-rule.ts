import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '../../../../../data';

import { ChangeActions } from '@common';
import { getCurrentUTCDate, getDateInBusinessTimezone } from '@core/date-time';
import { TransferTimeService } from '@module-common';
import { Injectable, Logger } from '@nestjs/common';
import { PurchaseInvoiceRule } from './purchase-invoice-rule';

export const WIRE_TRANSFER_OVERRIDE_WINDOW_KEY =
  'WIRE_TRANSFER_OVERRIDE_WINDOW';

@Injectable()
export class WireDeadlineRule implements PurchaseInvoiceRule {
  private logger: Logger = new Logger(WireDeadlineRule.name);

  constructor(private readonly transferTimeService: TransferTimeService) {}

  async run({
    entity,
  }: CommandInvoiceContext<PurchaseInvoiceRequest>): Promise<ChangeActions> {
    const currentDate = getCurrentUTCDate();
    const wireOverrideWindow = this.transferTimeService.getWireOverrideWindow();
    const wireOverrideStart = getDateInBusinessTimezone()
      .hour(wireOverrideWindow.start.hour)
      .minute(wireOverrideWindow.start.minute)
      .startOf('minute');

    const wireOverrideEnd = getDateInBusinessTimezone()
      .hour(wireOverrideWindow.end.hour)
      .minute(wireOverrideWindow.end.minute)
      .startOf('minute');
    if (
      currentDate.isAfter(wireOverrideStart) &&
      currentDate.isBefore(wireOverrideEnd)
    ) {
      this.logger.warn(
        `Wire deadline exceeded. Forcing payment type to false expedited for invoice ${entity.id}`,
      );
      entity.expedited = false;
    }
    return ChangeActions.empty();
  }
}
