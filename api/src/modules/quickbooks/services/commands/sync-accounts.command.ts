import { Command } from '@module-cqrs';

export class SyncAccountsCommand extends Command<void> {
  constructor() {
    super();
  }
}
