import { EntityManager, RequestContext } from '@mikro-orm/core';
import {
  AnalyticsInvoiceCreateEventHandler,
  AnalyticsInvoicePurchaseEventHandler,
} from '@module-analytics';
import { AppModule } from '@module-app';
import { Client, ClientService } from '@module-clients';
import { DatabaseService } from '@module-database';
import {
  ClientFactoringConfigsEntity,
  InvoiceEntity,
} from '@module-persistence';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EmptyReport, run } from '../util';

const logger = new Logger('sync-segment');

const sync = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);

  await databaseService.withRequestContext(async () => {
    const em = RequestContext.getEntityManager();
    if (em) {
      await syncForClients(app, em);
    }
  });
};

const syncForClients = async (
  app: INestApplicationContext,
  em: EntityManager,
) => {
  const clientService = app.get(ClientService);
  const invoicePurchaseEventHandler = app.get(
    AnalyticsInvoicePurchaseEventHandler,
  );
  const invoiceCreateEventHandler = app.get(AnalyticsInvoiceCreateEventHandler);
  const configs = await em.find(ClientFactoringConfigsEntity, {});
  for (const config of configs) {
    try {
      const client = await clientService.getOneById(config.clientId);
      await syncFirstPurchased(client, invoicePurchaseEventHandler);
      await syncLastSubmitted(em, client, invoiceCreateEventHandler);
    } catch (error) {
      logger.error(`Could not sync for client with ID ${config.clientId}`);
    }
  }
};

const syncFirstPurchased = async (
  client: Client,
  eventHandler: AnalyticsInvoicePurchaseEventHandler,
) => {
  await eventHandler.update({
    brokerId: null,
    client,
    purchasedAt: null,
  });
};

const syncLastSubmitted = async (
  em: EntityManager,
  client: Client,
  eventHandler: AnalyticsInvoiceCreateEventHandler,
) => {
  const invoices = await em.find(
    InvoiceEntity,
    {
      clientId: client.id,
    },
    {
      orderBy: {
        createdAt: 'DESC',
      },
      limit: 1,
    },
  );
  if (invoices.length === 0) {
    await eventHandler.update({
      client,
      invoice: invoices[0],
    });
  }
};

run(sync, new EmptyReport(), __dirname, { logError: true });
