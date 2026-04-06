import { Command } from '@module-cqrs';

export class SendNoaBombCommand extends Command<void> {
  constructor(readonly clientId: string) {
    super();
  }
}
