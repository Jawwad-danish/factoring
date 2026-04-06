import { InvoiceEvents } from '@common/events';
import { Observability } from '@core/observability';
import { ClientService } from '@module-clients';
import { CommandRunner } from '@module-cqrs';
import { DatabaseService, Transactional } from '@module-database';
import { AssignInvoiceActivityCommand } from '@module-invoices/commands';
import {
  AssignInvoiceActivityRequest,
  InvoiceRejectedEvent,
} from '@module-invoices/data';
import { NotificationsService } from '@module-notifications';
import {
  InvoiceEntity,
  InvoiceRepository,
  NotificationEntity,
  NotificationMedium,
  TagDefinitionKey,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class InvoiceRejectedNotifyClientEventHandler {
  private logger: Logger = new Logger(
    InvoiceRejectedNotifyClientEventHandler.name,
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly commandRunner: CommandRunner,
    private readonly clientService: ClientService,
  ) {}

  @OnEvent(InvoiceEvents.InvoiceRejected, { async: true })
  @Observability.WithScope('invoice-rejected.notify-client')
  async handleInvoiceRejection(event: InvoiceRejectedEvent) {
    await this.databaseService.withRequestContext(async () => {
      try {
        await this.handle(event);
      } catch (error) {
        this.logger.error(
          `Could not notify client for invoice rejected event`,
          error,
        );
      }
    });
  }

  @Transactional('invoice-rejected.notify-client')
  async handle(event: InvoiceRejectedEvent) {
    if (!event.request.notifyClient || !event.request.notificationMessage) {
      return;
    }

    const invoice = await this.invoiceRepository.getOneById(event.invoiceId);
    await this.notifyClient(invoice.id, event.request.notificationMessage);
  }

  private async notifyClient(invoiceId: string, message: string) {
    const invoice = await this.invoiceRepository.getOneById(invoiceId);
    const client = await this.clientService.getOneById(invoice.clientId);
    const subject = `Bobtail - Invoice Declined Load# ${invoice.loadNumber}`;

    const notifications = await this.notificationsService.notifyClient(
      client,
      subject,
      message,
    );
    if (notifications.length > 0) {
      await this.appendInvoiceActivity(
        invoice,
        notifications,
        subject,
        message,
      );
    }
  }

  private async appendInvoiceActivity(
    invoice: InvoiceEntity,
    notifications: NotificationEntity[],
    subject: string,
    message: string,
  ) {
    const note = this.buildNote(notifications);
    const activityRequest = new AssignInvoiceActivityRequest({
      key: TagDefinitionKey.NOTIFICATION,
      note: note,
      v1Payload: {
        invoice_id: invoice.id,
        notes: note,
        send_firebase_notification: true,
        update_status: 'note',
        update_type: 'note',
      },
      ingestThrough: true,
    });

    await this.commandRunner.run(
      new AssignInvoiceActivityCommand(invoice.id, activityRequest, {
        notifyExternalService: true,
        clientId: invoice.clientId,
        message,
        subject,
      }),
    );
  }

  private buildNote(notifications: NotificationEntity[]): string {
    const notificationDetails = notifications.reduce(
      (acc, notification: NotificationEntity) => {
        if (notification.medium === NotificationMedium.SMS) {
          acc.phone = notification.recipient || '<no-phone>';
          acc.phoneStatus = notification.status;
        } else if (notification.medium === NotificationMedium.EMAIL) {
          acc.email = notification.recipient || '<no-email>';
          acc.emailStatus = notification.status;
        } else if (notification.medium === NotificationMedium.PUSH) {
          acc.pushStatus = notification.status;
        }
        return acc;
      },
      {
        phone: '<no-phone>',
        email: '<no-email>',
        phoneStatus: 'pending',
        emailStatus: 'pending',
        pushStatus: 'pending',
      },
    );

    const note = `Notification sent to client for their invoice being rejected: Text message to ${
      notificationDetails.phone
    } was ${notificationDetails.phoneStatus?.toLowerCase()} and email to ${
      notificationDetails.email
    } was ${notificationDetails.emailStatus?.toLowerCase()} and push notification was ${notificationDetails.pushStatus?.toLowerCase()}`;
    return note;
  }
}
