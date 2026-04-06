import { ClientEvents } from '@common/events';
import { Observability } from '@core/observability';
import { ClientReleasedEvent } from '@module-clients';
import { DatabaseService, Transactional } from '@module-database';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SegmentService } from '../services';

@Injectable()
export class AnalyticsClientReleasedEventHandler {
  private logger: Logger = new Logger(AnalyticsClientReleasedEventHandler.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly segmentService: SegmentService,
  ) {}

  @OnEvent(ClientEvents.Released, { async: true })
  @Observability.WithScope('client-released-event')
  async handleInvoiceCreate(event: ClientReleasedEvent) {
    await this.databaseService.withRequestContext(async () => {
      try {
        await this.handle(event);
      } catch (error) {
        this.logger.error(`Could not update analytics - ${error}`);
      }
    });
  }

  @Transactional('analytics-client-released')
  async handle(event: ClientReleasedEvent) {
    await this.handleClientReleased(event);
  }

  private async handleClientReleased(
    event: ClientReleasedEvent,
  ): Promise<void> {
    this.segmentService.identify(event.client.mc, {
      email: event.client.email,
      id: event.client.id,
      dot: event.client.dot,
    });
    this.segmentService.track(event.client.mc, 'client-released', {
      email: event.client.email,
      id: event.client.id,
      dot: event.client.dot,
      releaseDate: event.releaseDate.toISOString(),
      releaseReason: event.releaseReason,
    });
  }
}
