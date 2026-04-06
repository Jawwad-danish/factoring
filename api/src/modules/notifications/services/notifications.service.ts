import { Client } from '@module-clients/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { CommandRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import { NotificationEntity } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import {
  CreateEmailNotificationCommand,
  EmailSendingAction,
  NotifyClientCommand,
} from '../commands';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly commandRunner: CommandRunner,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {}

  @Transactional('notify-client')
  async notifyClient(
    client: Client,
    subject: string,
    message: string,
  ): Promise<NotificationEntity[]> {
    return this.commandRunner.run(
      new NotifyClientCommand(client, subject, message),
    );
  }

  @Transactional('create-email-notification')
  async createEmailNotification(
    client: Client,
    emailSendingAction: EmailSendingAction,
  ): Promise<null | NotificationEntity> {
    if (!this.featureFlagResolver.isEnabled(FeatureFlag.Notifications)) {
      return null;
    }

    return await this.commandRunner.run(
      new CreateEmailNotificationCommand(client, emailSendingAction),
    );
  }
}
