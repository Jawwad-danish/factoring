import {
  ClientAccountPaymentAttributions,
  ClientAccountPayments,
  ClientPaymentRequest,
} from '../data';
import { UUID } from '@core/uuid';
import { randomInt } from 'crypto';
import Big from 'big.js';

export const buildStubClientPaymentRequest = (
  data?: Partial<ClientPaymentRequest>,
): ClientPaymentRequest => {
  const request = new ClientPaymentRequest({
    id: UUID.get(),
    clientId: UUID.get(),
    amount: Big(randomInt(1000)),
    transferFee: Big(0),
    clientAccountPaymentAttributions: [],
    clientAccountPayments: [],
  });
  Object.assign(request, data);
  return request;
};

export const buildStubClientAccountPaymentsRequest = (
  data?: Partial<ClientAccountPayments>,
) => {
  const request = new ClientAccountPayments({
    clientBankAccountId: UUID.get(),
  });
  Object.assign(request, data);
  return request;
};

export const buildStubClientPaymentAttributionsRequest = (
  data?: Partial<ClientAccountPaymentAttributions>,
) => {
  const request = new ClientAccountPaymentAttributions({
    invoiceId: UUID.get(),
    amount: Big(randomInt(1000)),
  });
  Object.assign(request, data);
  return request;
};
