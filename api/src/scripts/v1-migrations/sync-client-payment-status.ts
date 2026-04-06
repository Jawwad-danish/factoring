#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import fs from 'fs';
import path from 'path';
import { connectToV1Database } from '../util/parity/summary/utils';
import { mapStatusClientPayment } from './invoices/invoice-mapper';
import { AppModule } from '../../modules/app';
import { InvoiceRepository } from '@module-persistence/repositories';
import { ClientPaymentStatus } from '../../modules/persistence';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function main() {
  console.log('Starting database parity count...');

  const v1Config = {
    host: 'localhost',
    database: 'bobtail',
    user: '123',
    password: '123',
    port: 9990,
    connectionTimeoutMillis: 10000,
  };
  const v1Client = await connectToV1Database(v1Config);

  const app = await NestFactory.createApplicationContext(AppModule);
  const invoiceRepository = app.get(InvoiceRepository);

  const outputDir = __dirname;
  const timestamp = new Date().toISOString();

  console.log('Fetching invoices...');

  const invoicesQuery = `select * from invoices where created_at > '2025-04-01'`;
  const invoices = await v1Client.query(invoicesQuery);

  console.log(`Fetched ${invoices.rows.length} invoices`);

  const output = {};

  const statusToIds: Record<ClientPaymentStatus, string[]> = {
    [ClientPaymentStatus.Pending]: [],
    [ClientPaymentStatus.NotApplicable]: [],
    [ClientPaymentStatus.InProgress]: [],
    [ClientPaymentStatus.Sent]: [],
    [ClientPaymentStatus.Completed]: [],
    [ClientPaymentStatus.Failed]: [],
  };

  for (const invoice of invoices.rows) {
    const clientPaymentStatus = mapStatusClientPayment(invoice);
    statusToIds[clientPaymentStatus].push(invoice.id);
    output[invoice.id] = {
      previous: invoice.client_payment_status,
      new: clientPaymentStatus,
    };
  }

  for (const [status, ids] of Object.entries(statusToIds)) {
    console.log(`Status: ${status}, IDs: ${ids.join(', ')}`);
    const query = invoiceRepository
      .queryBuilder()
      .update({
        clientPaymentStatus: status as ClientPaymentStatus,
      })
      .where({
        id: { $in: ids },
      });
    if (!isDryRun) {
      await query.execute();
    } else {
      console.log('Dry run:', query.getFormattedQuery());
    }
  }

  fs.writeFileSync(
    path.join(outputDir, `sync-client-payment-status-${timestamp}.json`),
    JSON.stringify(output, null, 2),
  );
  await v1Client.end();
  await app.close();

  console.log('Database connections closed.');
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: any) {
    if (error.message && error.message.includes('connect')) {
      console.error('Database connection error:', error);
      process.exit(2);
    } else if (error.message && error.message.includes('query')) {
      console.error('Database query error:', error);
      process.exit(3);
    } else {
      console.error('Unexpected error:', error);
      process.exit(1);
    }
  }
}

run();
