import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { FilterQuery } from '@mikro-orm/core';
import { Client } from '@module-clients';
import { DatabaseService } from '@module-database';
import {
  AgeDilutionReserveCheck,
  ClientReservesCheck,
  ThresholdCheck,
  VerificationRequiredCheck,
} from '@module-invoices';
import {
  InvoiceEntity,
  InvoiceRepository,
  InvoiceStatus,
} from '@module-persistence';
import { NestFactory } from '@nestjs/core';
import { Big } from 'big.js';
import * as fs from 'fs';
import { checkAndGetForEnvVariable } from 'src/core/environment/util';
import { AppModule } from 'src/modules/app/app.module';
import { DomainReport, ParsingReport, getFiles, parseJSON, run } from '../util';

interface ClientValueItem {
  clientId: string;
  clientName: string;
  clientValues: Array<any>;
}

interface MappedClientData {
  clientId: string;
  shortName: string;
  name: string;
}

interface ResultItem {
  checkName: string;
  count: number;
  values: Array<ClientValueItem>;
}

export const runVerificationEngineAgainsDb = async (report: ParsingReport) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const invoiceRepository = app.get(InvoiceRepository);
  const thresholdCheck = app.get(ThresholdCheck);
  const reservesCheck = app.get(ClientReservesCheck);
  const ageDilutionReserveCheck = app.get(AgeDilutionReserveCheck);

  const checks = [thresholdCheck, reservesCheck, ageDilutionReserveCheck];

  const BATCH_SIZE = 50;
  const resultList: ResultItem[] = [
    { checkName: 'Unknown', count: 0, values: [] },
  ];
  const clientList: MappedClientData[] = getClientData(report);

  await databaseService.withRequestContext(
    async () =>
      await runVerification(
        invoiceRepository,
        checks,
        resultList,
        clientList,
        BATCH_SIZE,
      ),
  );

  for (const result of resultList) {
    console.log(
      `${result.count} invoices have failed the ${result.checkName} check.`,
    );
  }
  console.log(`\n`);
  fs.writeFileSync(
    `${__dirname}/verify_invoice_result.json`,
    JSON.stringify(resultList),
  );
};

const runVerification = async (
  invoiceRepository: InvoiceRepository,
  checks: VerificationRequiredCheck[],
  resultList: ResultItem[],
  clientList: MappedClientData[],
  batchSize: number,
) => {
  const invoiceFilter: FilterQuery<InvoiceEntity> = {
    status: InvoiceStatus.UnderReview,
  };
  const totalInvoiceCount = await invoiceRepository.count();
  const invoiceCount = await invoiceRepository.count(invoiceFilter);
  for (let batch = 0; batch < Math.ceil(invoiceCount / batchSize); batch++) {
    const offset = batch * batchSize;
    const invoiceBatch = await invoiceRepository.findAll(invoiceFilter, {
      limit: batchSize,
      offset: offset,
    });
    for (const invoice of invoiceBatch[0]) {
      for (const check of checks) {
        const result = await check.run({
          invoice,
          client: {} as unknown as Client,
          forceRun: false,
        });
        if (result) {
          addResult(result.payload, resultList, clientList, invoice);
        }
      }
    }
  }
  console.log(
    `\n\nRan script on a total of ${invoiceCount} invoices that have the status ${invoiceFilter.status}. Total number of invoices is ${totalInvoiceCount} \n`,
  );
};

const addResult = (
  resultPayload: {
    cause: string;
  } & Record<string, any>,
  resultList: ResultItem[],
  clientList: MappedClientData[],
  invoice: InvoiceEntity,
): void => {
  const { cause } = resultPayload;
  const { name, shortName } = clientList.filter(
    (client) => client.clientId === invoice.clientId,
  )[0];
  if (cause) {
    if (cause === 'ClientReserves') {
      resultPayload.client.reserve = formatToDollars(
        penniesToDollars(Big(resultPayload.client?.reserve)),
      );
      resultPayload.client.requiredReserve = formatToDollars(
        penniesToDollars(Big(resultPayload.client?.requiredReserve)),
      );
    }
    if (cause === 'Threshold') {
      resultPayload.systemThreshold = formatToDollars(
        penniesToDollars(Big(resultPayload.systemThreshold)),
      );
      resultPayload.invoiceTotalAmount = formatToDollars(
        penniesToDollars(Big(resultPayload.invoiceTotalAmount)),
      );
    }
    const clientValue = {
      ...resultPayload,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      loadNumber: invoice.loadNumber,
      clientName: name,
      shortName: shortName,
    };
    const index = resultList.findIndex((item) => item.checkName === cause);
    if (index > -1) {
      const clientIndex = resultList[index].values.findIndex(
        (item) => item.clientId === invoice.clientId,
      );
      resultList[index].count += 1;
      if (clientIndex > -1) {
        resultList[index].values[clientIndex].clientValues.push(clientValue);
      } else {
        resultList[index].values.push({
          clientId: invoice.clientId,
          clientName: name,
          clientValues: [clientValue],
        });
      }
    } else {
      const newResultItem: ResultItem = {
        checkName: cause as string,
        count: 1,
        values: [
          {
            clientId: invoice.clientId,
            clientName: name,
            clientValues: [clientValue],
          },
        ],
      };
      resultList.push(newResultItem);
    }
  } else {
    const clientValue = {
      ...resultPayload,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      loadNumber: invoice.loadNumber,
      clientName: name,
      shortName: shortName,
    };
    const index = resultList.findIndex((item) => item.checkName === 'Unknown');
    const clientIndex = resultList[index].values.findIndex(
      (item) => item.clientId === invoice.clientId,
    );
    resultList[index].count += 1;
    if (clientIndex > -1) {
      resultList[index].values[clientIndex].clientValues.push(clientValue);
    } else {
      resultList[index].values.push({
        clientId: invoice.clientId,
        clientName: name,
        clientValues: [clientValue],
      });
    }
  }
};

const getClientData = (report: ParsingReport): MappedClientData[] => {
  const clientList: MappedClientData[] = [];
  const path = checkAndGetForEnvVariable('SCRIPT_IMPORT_CLIENTS_DATA_PATH');
  const files = getFiles(path);
  for (const file of files) {
    const data = parseJSON(file, report);
    if (data) {
      for (const client of data) {
        const { shortened_name, name, id } = client;
        const mappedClient: MappedClientData = {
          shortName: shortened_name,
          name: name,
          clientId: id,
        };
        clientList.push(mappedClient);
      }
    }
  }
  return clientList;
};

const report = new DomainReport('verification-engine');
run(() => runVerificationEngineAgainsDb(report), report, __dirname);
