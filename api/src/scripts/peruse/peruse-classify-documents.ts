import { environment } from '@core/environment';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { AppModule } from '@module-app';
import { DatabaseService } from '@module-database';
import {
  BrokerPaymentStatus,
  InvoiceDocumentType,
  InvoiceEntity,
  InvoiceStatus,
} from '@module-persistence';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EmptyReport, run, writeObject } from '../util';
import { ClassifyInput, Peruse } from './peruse';
import { DocumentClassificationJob, InvoiceClassificationJob } from './types';

const logger = new Logger(__filename.replace('ts', ''));
const peruse = new Peruse(
  new HttpService(),
  environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_URL'),
  environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_KEY'),
);

const sync = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);

  await databaseService.withRequestContext(async () => {
    const em = RequestContext.getEntityManager();
    if (em) {
      await peruseChecklist(em);
    }
  });
};

const peruseChecklist = async (em: EntityManager) => {
  const invoiceResults: InvoiceClassificationJob[] = [];
  const invoices = await getInvoices(em);
  for (const invoice of invoices) {
    const documentClassifications = await classifyDocuments(invoice);
    invoiceResults.push({
      invoiceId: invoice.id,
      documentClassifications,
    });
  }
  writeObject(
    invoiceResults,
    __dirname,
    environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_CLASSIFY_PATH'),
  );
};

const getInvoices = async (em: EntityManager) => {
  logger.debug(`Fetching invoices from the database`);
  const invoices = await em.find(
    InvoiceEntity,
    {
      status: InvoiceStatus.Purchased,
      brokerPaymentStatus: {
        $in: [
          BrokerPaymentStatus.NotReceived,
          BrokerPaymentStatus.NonPayment,
          BrokerPaymentStatus.NonFactoredPayment,
        ],
      },
    },
    {
      populate: ['activities', 'documents'],
      limit: 100,
      orderBy: {
        createdAt: 'DESC',
        activities: {
          createdAt: 'ASC',
        },
      },
    },
  );
  logger.debug(
    `Found ${invoices.length} invoices that match the database filter criteria`,
  );
  const filtered = invoices.filter((invoice) => {
    const activities = invoice.activities;
    if (activities.length < 2) {
      return false;
    }
    const payloadData = activities[1].payload['data'];
    return (
      payloadData?.status?.newValue === 'purchased' &&
      payloadData?.status?.oldValue === 'under_review'
    );
  });
  logger.debug(
    `Only ${filtered.length} invoices were created and approved immediately after`,
  );
  return filtered;
};

const classifyDocuments = async (invoice: InvoiceEntity) => {
  logger.debug(
    `Classifying uploaded documents for invoice ${invoice.id} and load ${invoice.loadNumber}`,
  );
  const documents = invoice.documents.filter(
    (document) => document.type === InvoiceDocumentType.Uploaded,
  );
  const documentResults: DocumentClassificationJob[] = [];
  for (const document of documents) {
    try {
      const payload: ClassifyInput = {
        externalId: document.id,
        url: document.internalUrl || document.externalUrl,
        extract: true,
      };
      const result = await peruse.classifyDocument(payload);
      logger.debug(`Document with id ${document.id} sent for classification`);
      documentResults.push({
        peruseJobId: result.jobId,
        peruseJobType: result.jobType,
        documentId: document.id,
        payload,
      });
    } catch (error) {
      console.error(`Could not classify document with id ${document.id}`);
    }
  }
  return documentResults;
};

run(sync, new EmptyReport(), __dirname, { logError: true });
