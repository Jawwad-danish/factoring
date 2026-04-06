import { BrokerEvents, BrokerRatingChangedEvent } from '@common/events';
import { Observability } from '@core/observability';
import { Client, ClientApi, ClientContactType } from '@module-clients';
import { EmailService } from '@module-email';
import {
  NotificationEntity,
  NotificationMedium,
  NotificationStatus,
} from '@module-persistence';
import {
  InvoiceRepository,
  NotificationRepository,
} from '@module-persistence/repositories';
import { SmsService } from '@module-sms';
import { Transactional } from '@module-database';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class BrokerRatingChangedEventHandler {
  private readonly logger = new Logger(BrokerRatingChangedEventHandler.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly clientApi: ClientApi,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  @OnEvent(BrokerEvents.RatingChanged, { async: true })
  @Observability.WithScope('broker-rating-changed-notify-clients')
  @Transactional('broker-rating-changed-notify-clients')
  async handleBrokerRatingChanged(event: BrokerRatingChangedEvent) {
    try {
      await this.notifyAffectedClients(event);
    } catch (error) {
      this.logger.error(
        `Could not send notifications for broker rating change: ${
          error instanceof Error ? error.message : error
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async notifyAffectedClients(event: BrokerRatingChangedEvent) {
    const { brokerId, brokerName, newRating } = event;

    this.logger.log(
      `Processing broker rating change notification for broker ${brokerId} (${brokerName}) to rating ${newRating}`,
    );

    const clientIds =
      await this.invoiceRepository.findDistinctClientIdsByBroker(brokerId);

    if (clientIds.length === 0) {
      this.logger.log(
        `No clients found with open invoices or recent work with broker ${brokerId}`,
      );
      return;
    }

    this.logger.log(
      `Found ${clientIds.length} clients to notify for broker ${brokerId} rating change`,
    );

    const clients = await this.clientApi.findByIds(clientIds);

    for (const client of clients) {
      await this.sendNotificationToClient(client, brokerName, newRating);
    }
  }

  private async sendNotificationToClient(
    client: Client,
    brokerName: string,
    newRating: string,
  ) {
    const subject = 'Important: Broker Rating Change Notification';
    const message = this.buildNotificationBody(
      client.name,
      brokerName,
      newRating,
    );

    await this.notificationsService.notifyClient(client, subject, message);

    await this.sendToOwnerContacts(client, subject, message);

    this.logger.log(`Sent notifications to client ${client.id}`);
  }

  private async sendToOwnerContacts(
    client: Client,
    subject: string,
    message: string,
  ) {
    const ownerContacts =
      client.clientContacts?.filter(
        (contact) => contact.type === ClientContactType.OWNER,
      ) ?? [];

    const notifications: NotificationEntity[] = [];

    for (const owner of ownerContacts) {
      if (owner.email) {
        const notification = await this.sendOwnerEmail(
          client.id,
          owner.email,
          subject,
          message,
        );
        notifications.push(notification);
      }

      for (const contactPhone of owner.contactPhones ?? []) {
        if (contactPhone.phone) {
          const notification = await this.sendOwnerSms(
            client.id,
            contactPhone.phone,
            message,
          );
          notifications.push(notification);
        }
      }
    }

    if (notifications.length > 0) {
      await this.notificationRepository.saveAll(notifications);
    }
  }

  private async sendOwnerEmail(
    clientId: string,
    email: string,
    subject: string,
    message: string,
  ): Promise<NotificationEntity> {
    const notification = new NotificationEntity();
    notification.clientId = clientId;
    notification.medium = NotificationMedium.EMAIL;
    notification.message = message;
    notification.subject = subject;
    notification.recipient = email;

    try {
      await this.emailService.send({
        destination: { to: email },
        message: { subject, body: message },
      });
      notification.sentAt = new Date();
      notification.status = NotificationStatus.SENT;
      this.logger.log(`Sent owner email to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send owner email to ${email}`, error);
      notification.status = NotificationStatus.FAILED;
    }

    return notification;
  }

  private async sendOwnerSms(
    clientId: string,
    phone: string,
    message: string,
  ): Promise<NotificationEntity> {
    const notification = new NotificationEntity();
    notification.clientId = clientId;
    notification.medium = NotificationMedium.SMS;
    notification.message = message;
    notification.recipient = phone;

    try {
      await this.smsService.sendSms(phone, message);
      notification.sentAt = new Date();
      notification.status = NotificationStatus.SENT;
      this.logger.log(`Sent owner SMS to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send owner SMS to ${phone}`, error);
      notification.status = NotificationStatus.FAILED;
    }

    return notification;
  }

  private buildNotificationBody(
    clientName: string,
    brokerName: string,
    newRating: string,
  ): string {
    return `Hello ${clientName},

This is to inform you that ${brokerName} rating was changed to ${newRating}. Based on our records, you have worked with this broker in the last 6 months but due to their new rating, we are no longer able to factor their invoices effective immediately.

Regards,

The Bobtail Team`;
  }
}
