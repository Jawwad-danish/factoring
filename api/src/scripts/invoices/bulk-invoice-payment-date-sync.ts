import { DatabaseModule, DatabaseService } from '@module-database';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { batch } from '../../core/util/batch/batch';
import { connectToV1Database } from '../v1-parity/components/database';

interface V1InvoicePaymentDate {
  id: string;
  paid_date: Date | null;
}

@Module({
  imports: [DatabaseModule, PersistenceModule],
  exports: [],
})
export class BulkPaymentDateSyncModule {}

async function run() {
  console.log('Starting bulk invoice payment date sync...\n');

  const app = await NestFactory.createApplicationContext(
    BulkPaymentDateSyncModule,
  );
  const databaseService = app.get(DatabaseService);
  const v1Client = await connectToV1Database();

  let totalV1Invoices = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const BATCH_SIZE = 1000;

  try {
    console.log('[V1] Fetching all invoices with id and paid_date...');
    const v1Result = await v1Client.query<V1InvoicePaymentDate>(
      `SELECT id, paid_date 
       FROM invoices 
       WHERE paid_date IS NOT NULL`,
    );

    const v1Invoices = v1Result.rows;
    totalV1Invoices = v1Invoices.length;

    const v1PaymentDateMap = new Map<string, Date | null>();
    for (const invoice of v1Invoices) {
      v1PaymentDateMap.set(invoice.id, invoice.paid_date);
    }

    const totalBatches = Math.ceil(totalV1Invoices / BATCH_SIZE);
    console.log(
      `Processing ${totalV1Invoices} invoices in ${totalBatches} batches of ${BATCH_SIZE}\n`,
    );

    const batches = batch(v1Invoices, BATCH_SIZE);

    for (const [batchIndex, batchInvoices] of batches.entries()) {
      const batchNumber = batchIndex + 1;
      const batchStartTime = Date.now();

      console.log(
        `\n[Batch ${batchNumber}/${totalBatches}] Processing ${batchInvoices.length} invoices...`,
      );

      let batchUpdated = 0;

      try {
        await databaseService.withRequestContext(async () => {
          const em = databaseService.getEntityManager();

          await em.transactional(async (transactionalEm) => {
            const batchIds = batchInvoices.map((inv) => inv.id);
            const caseWhenClauses = batchInvoices
              .map(
                (inv) =>
                  `WHEN '${inv.id}' THEN '${new Date(
                    inv.paid_date!,
                  ).toISOString()}'`,
              )
              .join('\n          ');

            const bulkUpdateSQL = `
              UPDATE invoices 
              SET payment_date = CASE id
                ${caseWhenClauses}
                ELSE payment_date
              END
              WHERE id = ANY(ARRAY[${batchIds
                .map((id) => `'${id}'::uuid`)
                .join(',')}]) AND record_status = 'Active'
            `;

            const result = await transactionalEm
              .getConnection()
              .getKnex()
              .raw(bulkUpdateSQL);
            batchUpdated = result.rowCount || 0;
          });
        });

        updatedCount += batchUpdated;
        skippedCount += batchInvoices.length - batchUpdated;

        const processedSoFar = (batchIndex + 1) * batchInvoices.length;

        if (processedSoFar < totalV1Invoices) {
          const remaining = totalV1Invoices - processedSoFar;
          const avgBatchTime =
            (Date.now() - batchStartTime) / batchInvoices.length;
          const estimatedRemainingMs = remaining * avgBatchTime;
          const estimatedMinutes = (estimatedRemainingMs / 1000 / 60).toFixed(
            1,
          );
          console.log(`[Estimate] ~${estimatedMinutes} minutes remaining`);
        }
      } catch (error) {
        console.error(`[BATCH ERROR] Batch ${batchNumber}:`, error.message);
        errorCount += batchInvoices.length;
      }
    }

    console.log(`Total V1 invoices: ${totalV1Invoices}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped (null/missing/same): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  } finally {
    await v1Client.end();
    await app.close();
  }
}

run()
  .then(() => {
    console.log('Bulk payment date syncing completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Bulk payment date syncing failed:', error);
    process.exit(1);
  });
