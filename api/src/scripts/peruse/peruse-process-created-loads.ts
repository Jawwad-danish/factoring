import { writeToString } from '@fast-csv/format';
import { BobtailConfigModule } from '@module-config';
import { NestFactory } from '@nestjs/core';
import Big from 'big.js';
import * as fs from 'fs';
import { environment } from '../../core';
import { ifPresent, run } from '../util';
import { PeruseReport } from './peruse-report';
import { PeruseJobEntity, PeruseRepository } from './peruse-repository';

const process = async () => {
  await NestFactory.createApplicationContext(BobtailConfigModule);
  const peruseRepository = await PeruseRepository.init();
  const jobs = await peruseRepository.findAllJobs();
  const headers = Object.keys(toCSVRow(jobs[0]));
  const csvRows = jobs.map((job) => {
    const row = toCSVRow(job);
    const values: any[] = [];
    for (const header of headers) {
      values.push(row[header]);
    }
    return values;
  });
  await writeToCSV(headers, csvRows);
};

const toCSVRow = (job: PeruseJobEntity): Record<string, any> => {
  return {
    'Invoice ID': job.bobtailPayload.invoiceId,
    'Invoice created at (UTC)': job.bobtailPayload.createdAt,
    'Invoice approved at (UTC)': job.bobtailPayload.approvedAt,
    'Bobtail client name': job.bobtailPayload.clientName,
    'Bobtail client MC': job.bobtailPayload.clientMC,
    'Bobtail client DOT': job.bobtailPayload.clientDOT,
    'Peruse client name':
      job.perusePayload?.result?.verify_load_response?.fields?.carrier_name
        ?.rate_confirmation || '',
    'Peruse client MC':
      job.perusePayload?.result?.verify_load_response?.fields?.carrier_mc
        ?.rate_confirmation || '',
    'Peruse client DOT': ifPresent(
      job.perusePayload?.result?.verify_load_response?.fields?.carrier_dot
        ?.rate_confirmation,
      '',
      (value) => `peruse-dot ${value}`,
    ),
    'Broker name': job.bobtailPayload.brokerName,
    'Peruse broker name':
      job.perusePayload?.result?.verify_load_response?.fields?.broker_name
        ?.rate_confirmation || '',
    'Peruse broker MC':
      job.perusePayload?.result?.verify_load_response?.fields?.broker_mc
        ?.rate_confirmation || '',
    'Bobtail Load Number': job.bobtailPayload.loadNumber,
    'Peruse Load Number':
      job.perusePayload?.result?.debtor_system_verification?.load_number || '',
    'Bobtail Total Amount': new Big(job.bobtailPayload.totalAmount),
    'Peruse Total Amount': new Big(
      job.perusePayload?.result?.verify_load_response?.fields.rate
        ?.rate_confirmation_total_rate || 0,
    )
      .times(100)
      .toNumber(),
    'Missing BOL':
      (job.perusePayload?.result?.verify_load_response?.fields?.BOL_pages
        ?.present || 0) === 0
        ? 'Yes'
        : 'No',
    'Peruse verification BOL vs Rate confirmation probability':
      job?.perusePayload?.result?.verify_load_response
        ?.BOL_vs_rate_confirmation_probability,
    'Auto-Verify 1 Load is verified':
      job.perusePayload?.result?.debtor_system_verification?.load_is_verified ||
      false
        ? 'Yes'
        : 'No',
    'Auto-Verify 2 Load number':
      job.perusePayload?.result?.debtor_system_verification?.load_number || '',
    'Auto-Verify 3 Verifier':
      job.perusePayload?.result?.debtor_system_verification?.verifier || '',
    'Auto-Verify 4 Carrier MC':
      job.perusePayload?.result?.debtor_system_verification?.carrier_mc || '',
    'Auto-Verify 5 metadata': JSON.stringify(
      job.perusePayload?.result?.debtor_system_verification?.metadata || {},
    ),
    'Check 1 Bill of lading missing pages probability':
      job.perusePayload?.result?.verify_load_response?.checks
        ?.bol_pages_missing_probability,
    'Check 2 Damages or shortages probability':
      job.perusePayload?.result?.verify_load_response?.checks
        ?.damages_or_shortages_probability,
    'Check 3 Late delivery probability':
      job.perusePayload?.result?.verify_load_response?.checks
        ?.late_delivery_probability,
    'Check 4 Multistop probability':
      job.perusePayload?.result?.verify_load_response?.checks
        ?.multistop_probability,
    'Check 5 Produce probability':
      job.perusePayload?.result?.verify_load_response?.checks
        ?.produce_probability,
    'Check 6 Receiver stamp present':
      job.perusePayload?.result?.verify_load_response?.checks
        ?.receiver_stamp_present,
    'Check 7 Signature present probability':
      job.perusePayload?.result?.verify_load_response?.checks
        ?.signature_present_probability,
    'Check 8 Tonu':
      job.perusePayload?.result?.verify_load_response?.checks?.is_tonu,
    'Non payment': job.bobtailPayload.nonPaymentReason != null ? 'Yes' : 'No',
    'Non payment reason': job.bobtailPayload.nonPaymentReason,
    'Non payment created at': job.bobtailPayload.nonPaymentDate,
    'Non payment note': job.bobtailPayload.nonPaymentNote,
    'Rate confirmation vs known broker domain probability':
      job.perusePayload?.result?.verify_load_response?.fields
        ?.broker_email_domains
        ?.rate_confirmation_vs_known_broker_domain_probability,
    'Rate confirmation vs structured load data match probability':
      job.perusePayload?.result?.verify_load_response?.fields?.rate
        ?.rate_confirmation_vs_structured_load_data_match_probability,
    'PO reference number recent broker sequence': (
      job.perusePayload?.result?.verify_load_response?.fields
        ?.po_reference_number?.po_reference_number_recent_broker_sequence || []
    ).join(','),
    'Rate confirmation reference number conformity':
      job.perusePayload?.result?.verify_load_response?.fields
        ?.po_reference_number?.rate_confirmation_reference_number_conformity,
    'Delivery date BOL':
      job.perusePayload?.result?.verify_load_response?.fields?.delivery_date
        ?.BOL,
    'Delivery date delta in days':
      job.perusePayload?.result?.verify_load_response?.fields?.delivery_date
        ?.delta_in_days,
    'Delivery date match probability':
      job.perusePayload?.result?.verify_load_response?.fields?.delivery_date
        ?.match_probability,
    'Delivery date rate confirmation':
      job.perusePayload?.result?.verify_load_response?.fields?.delivery_date
        ?.rate_confirmation,
    'Pickup date BOL':
      job.perusePayload?.result?.verify_load_response?.fields?.pickup_date?.BOL,
    'Pickup date delta in days':
      job.perusePayload?.result?.verify_load_response?.fields?.pickup_date
        ?.delta_in_days,
    'Pickup date match probability':
      job.perusePayload?.result?.verify_load_response?.fields?.pickup_date
        ?.match_probability,
    'Pickup date rate confirmation':
      job.perusePayload?.result?.verify_load_response?.fields?.pickup_date
        ?.rate_confirmation,
    'Missing BOL pages':
      job.perusePayload?.result?.verify_load_response?.fields?.BOL_pages
        ?.missing,
  };
};

const writeToCSV = async (headers: string[], rows: any[]) => {
  const result = await writeToString(rows, {
    headers,
  });
  fs.writeFileSync(
    `${__dirname}/${environment.util.checkAndGetForEnvVariable(
      'SCRIPT_PERUSE_RESULT',
    )}`,
    result,
  );
};

run(process, new PeruseReport(), __dirname, { logError: true });
