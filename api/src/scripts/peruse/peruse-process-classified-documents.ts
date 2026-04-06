import { environment } from '@core/environment';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { AppModule } from '@module-app';
import { DatabaseService } from '@module-database';
import { InvoiceEntity } from '@module-persistence/entities';
import { HttpService } from '@nestjs/axios';
import { NestFactory } from '@nestjs/core';
import { EmptyReport, parseJSON, run } from '../util';
import { ProcessedInvoice, ProcessedInvoices } from './data';
import { Peruse } from './peruse';
import { InvoiceClassificationJob } from './types';

const peruse = new Peruse(
  new HttpService(),
  environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_URL'),
  environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_KEY'),
);

const process = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);

  await databaseService.withRequestContext(async () => {
    const em = RequestContext.getEntityManager();
    if (em) {
      await doProcess(em);
    }
  });
};

const doProcess = async (em: EntityManager) => {
  const invoiceClassifications = parseJSON(
    `${__dirname}/${environment.util.checkAndGetForEnvVariable(
      'SCRIPT_PERUSE_CLASSIFY_PATH',
    )}`,
  ) as InvoiceClassificationJob[];
  const processedInvoices = new ProcessedInvoices();
  for (const invoiceClassification of invoiceClassifications) {
    const invoice = await em.findOneOrFail(InvoiceEntity, {
      id: invoiceClassification.invoiceId,
    });
    const processedInvoice = await processInvoiceClassification(
      invoice,
      invoiceClassification,
    );
    processedInvoices.push(processedInvoice);
    if (
      processedInvoice.billOfLading.url &&
      processedInvoice.rateConfirmation.url
    ) {
      const { jobId, jobType } = await peruse.verifyLoad({
        billOfLadingUrl: processedInvoice.billOfLading.url,
        rateConfirmationUrl: processedInvoice.rateConfirmation.url,
      });
      processedInvoice.setVerificationJob({
        jobId,
        jobType,
      });
    }
  }
  processedInvoices.writeJSON(__dirname);
};

const processInvoiceClassification = async (
  invoice: InvoiceEntity,
  invoiceClassification: InvoiceClassificationJob,
) => {
  const processedInvoice = ProcessedInvoice.fromBobtailData({
    invoiceId: invoice.id,
    loadNumber: invoice.loadNumber,
    totalAmount: invoice.value.toNumber(),
  });
  for (const documentClassification of invoiceClassification.documentClassifications) {
    const result = await peruse.getJob(documentClassification.peruseJobId);
    if (result.isBillOfLading()) {
      processedInvoice.setBillOfLading(documentClassification.payload.url, {
        jobId: documentClassification.peruseJobId,
        jobType: documentClassification.peruseJobType,
      });
      continue;
    }

    const rateConfirmation = result.getRateConfirmationResult();
    if (rateConfirmation && result.isRateConfirmation()) {
      processedInvoice.setRateConfirmation(documentClassification.payload.url, {
        loadNumber: rateConfirmation.getBrokerReferenceNumber(),
        totalAmount: rateConfirmation.getTotalAmount().toNumber(),
        jobId: documentClassification.peruseJobId,
        jobType: documentClassification.peruseJobType,
      });
      continue;
    }
  }
  return processedInvoice;
};

run(process, new EmptyReport(), __dirname, { logError: true });
