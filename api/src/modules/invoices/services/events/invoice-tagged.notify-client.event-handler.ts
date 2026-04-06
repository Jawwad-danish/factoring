import { InvoiceEvents } from '@common/events';
import { Observability } from '@core/observability';
import { ClientService } from '@module-clients';
import { CommandRunner } from '@module-cqrs';
import { DatabaseService, Transactional } from '@module-database';
import { AssignInvoiceActivityCommand } from '@module-invoices/commands';
import {
  AssignInvoiceActivityRequest,
  InvoiceTaggedEvent,
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
export class InvoiceTaggedNotifyClientEventHandler {
  private logger: Logger = new Logger(
    InvoiceTaggedNotifyClientEventHandler.name,
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly commandRunner: CommandRunner,
    private readonly clientService: ClientService,
  ) {}

  @OnEvent(InvoiceEvents.InvoiceTagged, { async: true })
  @Observability.WithScope('invoice-tagged.notify-client')
  async handleInvoiceTagging(event: InvoiceTaggedEvent) {
    await this.databaseService.withRequestContext(async () => {
      try {
        await this.handle(event);
      } catch (error) {
        this.logger.error(
          `Could not notify client for invoice tagged event`,
          error,
        );
      }
    });
  }

  @Transactional('invoice-tagged.notify-client')
  async handle(event: InvoiceTaggedEvent) {
    if (!event.request.notifyClient || !event.request.notificationMessage) {
      return;
    }

    const invoice = await this.invoiceRepository.getOneById(event.invoiceId);
    const subject = `Bobtail - Invoice Flagged Load# ${invoice.loadNumber}`;
    const message = event.request.notificationMessage;
    const notifications = await this.notifyClient({
      clientId: invoice.clientId,
      subject,
      message,
    });
    if (notifications.length > 0) {
      await this.appendInvoiceActivity(
        invoice,
        notifications,
        subject,
        message,
      );
    }
  }

  private async notifyClient({
    clientId,
    subject,
    message,
  }: {
    clientId: string;
    subject: string;
    message: string;
  }): Promise<NotificationEntity[]> {
    const client = await this.clientService.getOneById(clientId);
    return await this.notificationsService.notifyClient(
      client,
      subject,
      message,
    );
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
      (acc, notification) => {
        if (notification.medium === NotificationMedium.SMS) {
          acc.phone = notification.recipient || '<no-phone>';
          acc.phoneStatus = notification.status;
        } else if (notification.medium === NotificationMedium.EMAIL) {
          acc.email = notification.recipient || '<no-email>';
          acc.emailStatus = notification.status;
        }
        return acc;
      },
      {
        phone: '<no-phone>',
        email: '<no-email>',
        phoneStatus: 'pending',
        emailStatus: 'pending',
      },
    );

    const note = `Notification sent to client for their invoice being flagged: Text message to ${
      notificationDetails.phone
    } was ${notificationDetails.phoneStatus?.toLowerCase()} and email to ${
      notificationDetails.email
    } was ${notificationDetails.emailStatus?.toLowerCase()}`;
    return note;
  }
}
