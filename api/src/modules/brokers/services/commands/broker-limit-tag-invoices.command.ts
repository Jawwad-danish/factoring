import { Command } from '@module-cqrs';

export class BrokerLimitTagInvoiceCommand extends Command<void> {
  constructor(readonly brokerId: string) {
    super();
  }
}
