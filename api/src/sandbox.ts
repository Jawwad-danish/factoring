import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';

const read = async (file: string): Promise<string[][]> => {
  const rows = parse(readFileSync(file), {
    delimiter: ',',
    quote: `'`,
    escape: `'`,
  });
  return rows;
};

const run = async () => {
  const inactiveBankAccounts = await read(
    '/home/ciprian/Documents/active-clients-with-transactions-for-inactive-bank-accounts.csv',
  );
  const primaryBankAccounts = await read(
    '/home/ciprian/Documents/active-clients-with-transactions-for-primary-bank-accounts.csv',
  );

  const missing: string[] = [];
  for (const inactive of inactiveBankAccounts) {
    let found = false;
    for (const primary of primaryBankAccounts) {
      if (inactive[1] === primary[2]) {
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(inactive[1]);
    }
  }

  console.log(missing);
};

run().then(() => console.log('done'));
