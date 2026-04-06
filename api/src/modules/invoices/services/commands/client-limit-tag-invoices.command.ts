import { Command } from '@module-cqrs';

export class ClientLimitTagInvoicesCommand extends Command<void> {
  constructor(readonly clientId: string) {
    super();
  }
}
