import { Client } from '@module-clients/data';
import { Command } from '@module-cqrs';
import { NotificationEntity } from '@module-persistence/entities';

export class NotifyClientCommand extends Command<NotificationEntity[]> {
  constructor(
    readonly client: Client,
    readonly subject: string,
    readonly body: string,
  ) {
    super();
  }
}
