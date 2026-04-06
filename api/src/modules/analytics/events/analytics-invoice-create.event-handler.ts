import { InvoiceEvents } from '@common/events';
import { Observability } from '@core/observability';
import { DatabaseService, Transactional } from '@module-database';
import { CreateInvoiceEvent } from '@module-invoices/data';
import { ClientFactoringAnalyticsEntity } from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SegmentService } from '../services';

@Injectable()
export class AnalyticsInvoiceCreateEventHandler {
  private logger: Logger = new Logger(AnalyticsInvoiceCreateEventHandler.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly segmentService: SegmentService,
    private readonly repositories: Repositories,
  ) {}

  @OnEvent(InvoiceEvents.CreateInvoice, { async: true })
  @Observability.WithScope('invoice-create-event')
  async handle(event: CreateInvoiceEvent) {
    await this.databaseService.withRequestContext(async () => {
      try {
        await this.update(event);
      } catch (error) {
        this.logger.error(`Could not update analytics - ${error}`);
      }
    });
  }

  @Transactional('analytics-invoice-create')
  async update({ client, invoice }: CreateInvoiceEvent) {
    let analytics =
      await this.repositories.clientFactoringAnalytics.findByClientId(
        client.id,
      );
    if (!analytics) {
      analytics = new ClientFactoringAnalyticsEntity();
      analytics.clientId = client.id;
      this.repositories.persist(analytics);
    }

    if (!analytics.firstCreatedDate) {
      const firstSubmittedInvoiceDate = await this.handleFirstSubmittedInvoice({
        client,
        invoice,
      });
      analytics.firstCreatedDate = firstSubmittedInvoiceDate;
      this.logger.debug('Updated first created date for analytics', {
        clientId: client.id,
        createdAt: invoice.createdAt,
      });
    }

    await this.handleInvoiceSubmit({ invoice, client });
  }

  private async handleFirstSubmittedInvoice({
    invoice,
    client,
  }: CreateInvoiceEvent): Promise<Date> {
    const firstSubmittedInvoiceDate =
      (await this.repositories.invoice.firstCreatedInvoiceDate(client.id)) ||
      invoice.createdAt;
    this.segmentService.identify(client.mc, {
      email: client.email,
      id: client.id,
      dot: client.dot,
    });
    this.segmentService.track(client.mc, 'first-invoice-submitted-date', {
      email: client.email,
      id: client.id,
      dot: client.dot,
      firstSubmittedInvoiceDate: firstSubmittedInvoiceDate.toISOString(),
    });
    return firstSubmittedInvoiceDate;
  }

  private async handleInvoiceSubmit({
    invoice,
    client,
  }: CreateInvoiceEvent): Promise<void> {
    this.segmentService.identify(client.mc, {
      email: client.email,
      id: client.id,
      dot: client.dot,
    });
    this.segmentService.track(client.mc, 'last-invoice-submitted-date', {
      email: client.email,
      id: client.id,
      dot: client.dot,
      lastSubmittedInvoiceDate: invoice.createdAt.toISOString(),
    });
  }
}
