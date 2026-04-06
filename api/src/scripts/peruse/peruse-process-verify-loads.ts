import { environment } from '@core/environment';
import { writeToString } from '@fast-csv/format';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { AppModule } from '@module-app';
import { DatabaseService } from '@module-database';
import { HttpService } from '@nestjs/axios';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { EmptyReport, run } from '../util';
import { ProcessedInvoices } from './data';
import { Peruse } from './peruse';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doProcess = async (_em: EntityManager) => {
  const processedInvoices = ProcessedInvoices.fromJSON(__dirname);
  for (const processedInvoice of processedInvoices.items) {
    const verifyLoadJobId = processedInvoice.peruse.jobId;
    if (!verifyLoadJobId) {
      continue;
    }
    const result = await peruse.getJob(verifyLoadJobId);
    processedInvoice.setVerification(
      result.getVerificationStatus(),
      result.getVerificationProbability(),
    );
  }
  await writeCSV(processedInvoices);
};

const writeCSV = async (processedInvoices: ProcessedInvoices) => {
  const result = await writeToString(
    processedInvoices.items.map((processedInvoice) => {
      return [
        processedInvoice.bobtail.invoiceId,
        processedInvoice.bobtail.loadNumber,
        processedInvoice.peruse.loadNumber,
        processedInvoice.bobtail.totalAmount,
        processedInvoice.peruse.totalAmount,
        processedInvoice.rateConfirmation.url != null ? 'Yes' : 'No',
        processedInvoice.billOfLading.url != null ? 'Yes' : 'No',
        processedInvoice.peruse.verificationProbability ?? 0,
      ];
    }),
    {
      headers: [
        'Invoice ID',
        'Bobtail Load Number',
        'Peruse Load Number',
        'Bobtail Total Amount',
        'Peruse Total Amount',
        'Rate confirmation',
        'Bill of lading',
        'Peruse verification BOL vs Rate confirmation probability',
      ],
    },
  );
  fs.writeFileSync(
    `${__dirname}/${environment.util.checkAndGetForEnvVariable(
      'SCRIPT_PERUSE_RESULT',
    )}`,
    result,
  );
};

run(process, new EmptyReport(), __dirname, { logError: true });
