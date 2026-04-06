import { EmailDestination, EmailMessage } from '@module-aws';
import { Client, ClientContactType } from '@module-clients/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { BasicCommandHandler } from '@module-cqrs';
import { EmailService } from '@module-email';
import { FIREBASE_SERVICE, FirebaseService } from '@module-firebase';
import {
  NotificationEntity,
  NotificationMedium,
  NotificationStatus,
} from '@module-persistence';
import {
  ClientFactoringConfigsRepository,
  FirebaseTokenRepository,
  NotificationRepository,
} from '@module-persistence/repositories';
import { SmsService } from '@module-sms';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { NotifyClientCommand } from '../notify-client.command';

@CommandHandler(NotifyClientCommand)
export class NotifyClientCommandHandler
  implements BasicCommandHandler<NotifyClientCommand>
{
  private logger = new Logger(NotifyClientCommandHandler.name);

  constructor(
    private notificationRepository: NotificationRepository,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
    private readonly firebaseTokenRepository: FirebaseTokenRepository,
    @Inject(FIREBASE_SERVICE) private readonly firebaseService: FirebaseService,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {}

  async execute({
    client,
    subject,
    body,
  }: NotifyClientCommand): Promise<NotificationEntity[]> {
    const notifications: NotificationEntity[] = [];

    const pushNotification = await this.sendPushNotification(
      client,
      subject,
      body,
    );
    if (pushNotification) {
      notifications.push(pushNotification);
    }

    const smsNotification = await this.sendSms(client, body);
    if (smsNotification) {
      notifications.push(smsNotification);
    }

    const emailNotification = await this.sendEmail(client, subject, body);
    notifications.push(emailNotification);

    this.notificationRepository.persist(notifications);
    return notifications;
  }

  private async sendSms(
    client: Client,
    message: string,
  ): Promise<NotificationEntity | null> {
    const phoneNumber = client.clientContacts?.find(
      (contact) => contact.type === ClientContactType.BUSINESS,
    )?.contactPhones?.[0]?.phone;

    if (!phoneNumber) {
      this.logger.warn(
        `Could not find business phone number for client ${client.id}`,
      );
      return null;
    }

    const smsNotification = new NotificationEntity();
    smsNotification.clientId = client.id;
    smsNotification.medium = NotificationMedium.SMS;
    smsNotification.message = message;
    smsNotification.recipient = phoneNumber;

    try {
      if (this.featureFlagResolver.isEnabled(FeatureFlag.Notifications)) {
        await this.smsService.sendSms(phoneNumber, message);
      }
      smsNotification.sentAt = new Date();
      smsNotification.status = NotificationStatus.SENT;
    } catch (error) {
      this.logger.error(
        `Failed sending notification sms to client ${client.name}`,
        {
          clientId: client.id,
          error,
        },
      );
      smsNotification.status = NotificationStatus.FAILED;
    }
    return smsNotification;
  }

  private async sendEmail(
    { id, email }: Client,
    subject: string,
    body: string,
  ): Promise<NotificationEntity> {
    const notification = new NotificationEntity();
    notification.clientId = id;
    notification.medium = NotificationMedium.EMAIL;
    notification.message = body;
    notification.subject = subject;
    notification.recipient = email;

    const destination: EmailDestination = {
      to: email,
    };
    const message: EmailMessage = {
      subject: subject,
      body: body,
    };
    try {
      if (this.featureFlagResolver.isEnabled(FeatureFlag.Notifications)) {
        await this.emailService.send({ destination, message });
      }
      notification.sentAt = new Date();
      notification.status = NotificationStatus.SENT;
    } catch (error) {
      this.logger.error(
        `Failed sending notification email to ${destination.to} for client`,
        {
          clientId: id,
          error,
        },
      );
      notification.status = NotificationStatus.FAILED;
    }
    return notification;
  }

  private async sendPushNotification(
    { id }: Client,
    subject: string,
    message: string,
  ): Promise<NotificationEntity | null> {
    const clientFactoringConfig =
      await this.clientFactoringConfigsRepository.getOneByClientId(id);

    const userTokens = await this.firebaseTokenRepository.findTokensByUserId(
      clientFactoringConfig.userId,
    );

    if (userTokens.length === 0) {
      this.logger.log(
        `No user tokens found for client ${id}. Skipping push notifications.`,
      );
      return null;
    }

    const notification = new NotificationEntity();
    notification.clientId = id;
    notification.medium = NotificationMedium.PUSH;
    notification.message = message;
    notification.subject = subject;

    try {
      for (const userToken of userTokens) {
        if (this.featureFlagResolver.isEnabled(FeatureFlag.Notifications)) {
          await this.firebaseService.sendPushNotification({
            token: userToken.token,
            notification: { title: subject, body: message },
          });
        }
      }
      notification.sentAt = new Date();
      notification.status = NotificationStatus.SENT;
    } catch (error) {
      this.logger.error(`Failed sending notification push to client ${id}`, {
        clientId: id,
        error,
      });
      notification.status = NotificationStatus.FAILED;
    }
    return notification;
  }
}
