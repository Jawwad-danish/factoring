import { InvoiceEvents } from '@common/events';
import { penniesToDollars } from '@core/formulas';
import { Observability } from '@core/observability';
import { Client } from '@module-clients';
import { DatabaseService, Transactional } from '@module-database';
import { PurchaseInvoiceEvent } from '@module-invoices/data';
import { ClientFactoringAnalyticsEntity } from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SegmentService } from '../services';

@Injectable()
export class AnalyticsInvoicePurchaseEventHandler {
  private logger: Logger = new Logger(
    AnalyticsInvoicePurchaseEventHandler.name,
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly segmentService: SegmentService,
    private readonly repositories: Repositories,
  ) {}

  @OnEvent(InvoiceEvents.PurchaseInvoice, { async: true })
  @Observability.WithScope('invoice-purchased-event')
  async handle(event: PurchaseInvoiceEvent) {
    await this.databaseService.withRequestContext(async () => {
      try {
        await this.update(event);
      } catch (error) {
        this.logger.error(`Could not update analytics - ${error}`);
      }
    });
  }

  @Transactional('analytics-invoice-purchase')
  async update({ client, purchasedAt }: PurchaseInvoiceEvent) {
    let analytics =
      await this.repositories.clientFactoringAnalytics.findByClientId(
        client.id,
      );

    if (!analytics) {
      analytics = new ClientFactoringAnalyticsEntity();
      analytics.clientId = client.id;
      this.repositories.persist(analytics);
    }

    await this.handleFactoredVolume(client);

    if (analytics.firstPurchasedDate) {
      this.logger.debug('Analytics for purchased at already defined', {
        clientId: client.id,
        purchasedAt,
      });
      return;
    }

    const firstPurchasedInvoiceDate =
      await this.repositories.invoice.firstPurchasedInvoiceDate(client.id);
    analytics.firstPurchasedDate = firstPurchasedInvoiceDate || purchasedAt;
    if (!analytics.firstCreatedDate) {
      const { id, name, email } = client;
      this.logger.warn(`No analytics available for first purchased date`, {
        client: {
          id,
          name,
          email,
        },
      });
      return;
    }
    this.segmentService.identify(client.mc, {
      email: client.email,
      id: client.id,
      dot: client.dot,
    });
    this.segmentService.track(client.mc, 'first-invoice-purchased-date', {
      email: client.email,
      id: client.id,
      dot: client.dot,
      firstPurchasedDate: analytics.firstPurchasedDate?.toISOString(),
    });
  }

  async handleFactoredVolume(client: Client) {
    const factoredVolume =
      await this.repositories.invoice.getTotalPurchasedInvoicesByClientId(
        client.id,
      );

    this.segmentService.identify(client.mc, {
      email: client.email,
      id: client.id,
      dot: client.dot,
    });
    this.segmentService.track(client.mc, 'analytics-invoice-purchase', {
      email: client.email,
      id: client.id,
      dot: client.dot,
      factoredVolume: penniesToDollars(factoredVolume).toFixed(2),
      factoredVolumePennies: factoredVolume.toFixed(),
    });
  }
}
