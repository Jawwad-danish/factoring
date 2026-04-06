import { DatabaseModule, DatabaseService } from '@module-database';
import { PersistenceModule, Repositories } from '@module-persistence';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import path from 'path';
import { ClientParity } from './clients/clients-parity';
import { connectToV1Database } from './components/database';
import { InvoiceParity } from './invoices/invoices-parity';

@Module({
  imports: [DatabaseModule, PersistenceModule],
  exports: [],
})
export class ParityModule {}

async function run() {
  console.log(__dirname);
  const app = await NestFactory.createApplicationContext(ParityModule);
  const repositories = app.get(Repositories);
  const v1Client = await connectToV1Database();
  const strategies = [
    new InvoiceParity(v1Client, repositories),
    new ClientParity(v1Client, repositories),
  ];

  let output = {};
  await app.get(DatabaseService).withRequestContext(async () => {
    for (const strategy of strategies) {
      const result = await strategy.run();
      output = { ...output, ...result };
    }
  });
  fs.writeFileSync(
    path.join(__dirname, 'parity-output.json'),
    JSON.stringify(output, null, 4),
  );
}

run()
  .then(() => {
    console.log('Parity completed successfully.');
    process.exit(0);
  })
  .catch((error) => console.error('Parity failed.', error));
