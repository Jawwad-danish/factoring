import { Client } from '@module-clients/data';
import { Command } from '@module-cqrs';
import { EmailSendResponse } from '@module-email';
import { NotificationEntity } from '@module-persistence/entities';

export type EmailSendingAction = () => Promise<null | EmailSendResponse>;

export class CreateEmailNotificationCommand extends Command<NotificationEntity> {
  constructor(
    readonly client: Client,
    readonly emailSendingAction: EmailSendingAction,
  ) {
    super();
  }
}
