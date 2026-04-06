import { verifyBrokerPaymentsParity } from './broker-payments/verify-broker-payments';
import { verifyClientPaymentsParity } from './client-payments/verify-client-payments';
import { verifyClientFactoringParity } from './clients/verify-client-factoring-config-parity';
import { verifyInvoicesParity } from './invoices/verify-invoices-parity';
import { verifyReservesParity } from './reserves/verify-reserves';
import { verifyBatchPaymentsParity } from './batch-payments/verify-batch-payments';
import { verifyReserveAccountFundsParity } from './reserve-account-funds/verify-reserve-account-funds';

import { differenceInSeconds, run } from '../util';
import { MasterParityReport } from '../util/parity';

type ParityOperation = (masterReport: MasterParityReport) => Promise<void>;

const operations: ParityOperation[] = [
  verifyClientFactoringParity,
  verifyInvoicesParity,
  verifyBatchPaymentsParity,
  verifyClientPaymentsParity,
  verifyBrokerPaymentsParity,
  verifyReservesParity,
  verifyReserveAccountFundsParity,
];

const report = new MasterParityReport();
const parityAll = async () => {
  const startTime = Date.now();
  for (const operation of operations) {
    await operation(report);
  }
  const endTime = Date.now();
  console.log(
    `Parity script run time: ${differenceInSeconds(endTime, startTime)}s`,
  );
};

run(parityAll, report, __dirname, { logError: true });
