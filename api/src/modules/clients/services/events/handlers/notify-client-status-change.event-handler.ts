import { Observability } from '@core/observability';
import { QueryRunner } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { ClientToActiveEmail, ClientToOnHoldEmail } from '@module-email';
import { NotificationsService } from '@module-notifications';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FindClientsByIds } from '../../queries';
import { ClientStatusChangedEvent } from '../client-status-changed.event';

@Injectable()
export class NotifyClientStatusChangeEventHandler {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly queryRunner: QueryRunner,
    private readonly notificationService: NotificationsService,
    private readonly clientToActiveEmail: ClientToActiveEmail,
    private readonly clientToOnHoldEmail: ClientToOnHoldEmail,
  ) {}

  @OnEvent(ClientStatusChangedEvent.EVENT_NAME, { async: true })
  @Observability.WithScope('notify-client-status-change')
  async handleSendNoaEmail(event: ClientStatusChangedEvent) {
    await this.databaseService.withRequestContext(async () => {
      await this.doHandleSendNoaEmail(event);
    });
  }

  private async doHandleSendNoaEmail({
    clientStatusChanges,
  }: ClientStatusChangedEvent) {
    const clients = await this.queryRunner.run(
      new FindClientsByIds(clientStatusChanges.map((c) => c.clientId)),
    );
    for (const change of clientStatusChanges) {
      const client = clients.find((c) => c.id === change.clientId);
      if (!client) {
        continue;
      }
      if (change.updatedStatus === ClientFactoringStatus.Hold) {
        await this.notificationService.createEmailNotification(
          client,
          async () => {
            return await this.clientToOnHoldEmail.send({
              client,
              reason: change.reason,
            });
          },
        );
      }
      if (change.updatedStatus === ClientFactoringStatus.Active) {
        await this.notificationService.createEmailNotification(
          client,
          async () => {
            return await this.clientToActiveEmail.send(client);
          },
        );
      }
    }
  }
}
