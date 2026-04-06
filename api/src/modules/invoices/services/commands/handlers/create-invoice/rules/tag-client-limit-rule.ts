import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { CommandInvoiceContext } from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { InvoiceRule } from '../../common';

@Injectable()
export class TagClientLimitRule implements InvoiceRule<CreateInvoiceRequest> {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async run({
    client,
  }: CommandInvoiceContext<CreateInvoiceRequest>): Promise<ChangeActions> {
    const arAmount =
      await this.invoiceRepository.getLast30DaysTotalARUnpaidByClient(
        client.id,
      );
    const { clientLimitAmount } = client.factoringConfig;
    if (clientLimitAmount == null) {
      return ChangeActions.empty();
    }

    if (new Big(arAmount).lt(new Big(clientLimitAmount))) {
      return ChangeActions.empty();
    }

    return ChangeActions.addTagAndActivity(
      TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
      Note.from({
        payload: {
          clientLimitAmount: clientLimitAmount.toFixed(),
          arAmount: arAmount.toFixed(),
        },
      }),
    );
  }
}
