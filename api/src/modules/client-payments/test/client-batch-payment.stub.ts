import { PaymentType } from '@module-persistence/entities';
import { UUID } from '@core/uuid';
import { CreateClientBatchPaymentRequest } from '../data';

export const buildStubClientBatchPaymentRequest = (
  data?: Partial<CreateClientBatchPaymentRequest>,
): CreateClientBatchPaymentRequest => {
  const request = new CreateClientBatchPaymentRequest({
    s3FileKey: 's3FileKey',
    bucketName: 'bucket',
  });
  Object.assign(request, data);
  return request;
};

export const stubClientBatchPaymentDataObject = (
  type?: PaymentType,
): Record<string, any> => {
  return {
    id: UUID.get(),
    status: 'sent',
    display_id: 38495,
    transfer_type: type ?? 'ach',
    client_payments: [
      {
        id: UUID.get(),
        client_id: UUID.get(),
        fee: 0,
        amount: 58056,
        clientaccountpayments: [
          {
            client_bank_account_id: UUID.get(),
          },
        ],
        client_account_payment_attributions: [
          {
            invoice_id: UUID.get(),
            amount: 29028,
          },
          {
            invoice_id: UUID.get(),
            amount: 29028,
          },
        ],
      },
    ],
  };
};
