import { environment } from '@core/environment';
import { Arrays } from '@core/util';
import path from 'path';
import { getFiles, parseJSON } from 'src/scripts/util';
import { extractHistoricalData } from './audit-log-extractor';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_AUDIT_LOGS_BROKER_PAYMENTS_PATH',
);

const files = getFiles(path.resolve(PATH));
const entries: Record<string, any>[] = [];
files.forEach((file) => entries.push(...parseJSON(file)));
const grouped = Arrays.group(entries, (entry) => entry.invoice_id! as string);
extractHistoricalData(
  Arrays.group(
    grouped.get('12b60a3e-4fa8-43d9-bdd3-1b6f55775952')!,
    (entry) => entry.original_id! as string,
  ),
  [
    'amount',
    'check_number',
    'batch_date',
    'days_to_pay',
    'invoice_id',
    'transaction_type',
    'metadata',
    'changelog_notes',
    'is_created',
    'is_deleted',
  ],
);
