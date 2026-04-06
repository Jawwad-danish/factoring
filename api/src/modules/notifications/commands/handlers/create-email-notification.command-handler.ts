import { BasicCommandHandler } from '@module-cqrs';
import {
  NotificationEntity,
  NotificationMedium,
  NotificationStatus,
} from '@module-persistence';
import { NotificationRepository } from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { CreateEmailNotificationCommand } from '../create-email-notification.command';

@CommandHandler(CreateEmailNotificationCommand)
export class CreateEmailNotificationCommandHandler
  implements BasicCommandHandler<CreateEmailNotificationCommand>
{
  private logger = new Logger(CreateEmailNotificationCommandHandler.name);

  constructor(private notificationRepository: NotificationRepository) {}

  async execute({
    client,
    emailSendingAction,
  }: CreateEmailNotificationCommand): Promise<NotificationEntity> {
    const notification = new NotificationEntity();
    notification.subject = '';
    notification.message = '';
    notification.clientId = client.id;
    notification.medium = NotificationMedium.EMAIL;

    try {
      const result = await emailSendingAction();
      if (result != null) {
        notification.recipient = result.destination.to[0];
        notification.subject = result.message.subject;
        notification.message = result.message.body;
        notification.sentAt = new Date();
        notification.status = NotificationStatus.SENT;
      } else {
        notification.status = NotificationStatus.FAILED;
      }
    } catch (error) {
      this.logger.error(`Failed sending email notification`, {
        error,
        clientId: client.id,
      });
      notification.status = NotificationStatus.FAILED;
    }

    this.notificationRepository.persist(notification);
    return notification;
  }
}
