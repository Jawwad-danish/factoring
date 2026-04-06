import { environment } from '@core/environment';
import { batchProcess } from '@core/util';
import { AppModule } from '@module-app';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Client } from 'pg';
import { run } from '../util';
import { Load, Loads } from './data';
import { Peruse } from './peruse';
import { PeruseReport } from './peruse-report';

const logger = new Logger(__dirname.replace('ts', ''));
const report = new PeruseReport();
const peruse = new Peruse(
  new HttpService(),
  environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_URL'),
  environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_KEY'),
);
const database = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sandbox',
  password: '',
  port: 5432,
});

const process = async () => {
  await database.connect();
  await NestFactory.createApplicationContext(AppModule);
  const invoiceLoads = Loads.fromJSON(__dirname);
  await batchProcess(invoiceLoads.items, 50, fetchFromPeruse);
};

const fetchFromPeruse = async (load: Load) => {
  logger.debug(`Fetching peruse job with id ${load.jobId}`);
  try {
    const jobResult = await peruse.getJobAsRaw(load.jobId);
    await database.query(
      `INSERT INTO jobs(job_id, invoice_id, peruse_payload, bobtail_payload) VALUES($1, $2, $3, $4)`,
      [
        jobResult.job_id,
        load.bobtail.invoiceId,
        jobResult,
        JSON.stringify(load.bobtail),
      ],
    );
  } catch (error) {
    logger.error(error);
    report.addJob({
      invoiceId: load.bobtail.invoiceId,
      jobId: load.jobId,
      status: 'unreachable',
    });
  }
  return null;
};

run(process, report, __dirname, { logError: true });
