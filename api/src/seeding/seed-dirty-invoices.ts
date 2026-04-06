import { TagDefinitionKey } from '@module-persistence';
import {
  InvoiceSeeder,
  SeedersModules,
  getRandomElement,
} from '@module-seeders';
import { NestFactory } from '@nestjs/core';
import { Command } from 'commander';
import { DatabaseService } from '../modules/database';

import * as broker from '../scripts/mock-server/resources/broker.json';
import * as client from '../scripts/mock-server/resources/clients/client.json';

// These are just some of them
const flaggingTagKeys = [
  TagDefinitionKey.MISSING_BILL_OF_LADING,
  TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION,
  TagDefinitionKey.BROKER_INFORMATION_MISSING,
  TagDefinitionKey.TRANSFER_FAILED,
  TagDefinitionKey.FILED_ON_BROKER_BOND,
  TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
  TagDefinitionKey.FRAUDULENT_DOCUMENTS,
];

const program = new Command();

program
  .option('-n, --number <number>', 'Number of invoices to seed', '10000')
  .parse(process.argv);

const options = program.opts();
const numberOfInvoices = parseInt(options.number, 10);

if (isNaN(numberOfInvoices) || numberOfInvoices <= 0) {
  throw new Error(`Invalid number of invoices ${numberOfInvoices}`);
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedersModules);
  const seeder = app.get(InvoiceSeeder);
  const databaseService = app.get(DatabaseService);

  await databaseService.withRequestContext(async () => {
    const clientId = client.id;
    const brokerId = broker.id;
    for (let i = 0; i < numberOfInvoices; i++) {
      const tagKey = getRandomElement(flaggingTagKeys);
      await seeder.createInvoice({ tags: [tagKey] }, clientId, brokerId);
    }
    await seeder.flush();
  });
  await app.close();
}

bootstrap();
