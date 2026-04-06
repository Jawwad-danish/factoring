import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { CommandInvoiceContext } from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { InvoiceRule } from '../../common';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';

@Injectable()
export class TagBrokerLimitRule implements InvoiceRule<CreateInvoiceRequest> {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async run({
    broker,
  }: CommandInvoiceContext<CreateInvoiceRequest>): Promise<ChangeActions> {
    if (!broker) {
      return ChangeActions.empty();
    }
    const amount = await this.invoiceRepository.getTotalAmountUnpaidByBroker(
      broker.id,
    );

    const limitAmount = broker?.factoringConfig.limitAmount;

    if (limitAmount === null || limitAmount === undefined) {
      return ChangeActions.empty();
    }

    if (new Big(amount).lt(new Big(limitAmount))) {
      return ChangeActions.empty();
    }

    return ChangeActions.addTagAndActivity(
      TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
      Note.from({
        payload: {
          brokerLimit: limitAmount.toFixed(),
          amount: amount.toFixed(),
        },
      }),
    );
  }
}
