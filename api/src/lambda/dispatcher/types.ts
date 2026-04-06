export type LambdaCreateBatchPaymentRequest = {
  id: string;
  name: string;
  type: string;
  status: string;
  clientPayments: LambdaClientPayment[];
};

export type LambdaClientPayment = {
  id: string;
  clientId: string;
  amount: number;
  transferFee: number;
  clientAccountPayments: LambdaClientAccountPayment[];
  clientAccountPaymentAttributions: LambdaClientAccountPaymentAttribution[];
};

export type LambdaClientAccountPayment = {
  clientBankAccountId: string;
};

export type LambdaClientAccountPaymentAttribution = {
  invoiceId: string;
  amount: number;
};
