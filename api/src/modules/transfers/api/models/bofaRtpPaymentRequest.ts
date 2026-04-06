export interface BofaPaymentRequest {
  amount: number;
  creditorName: string;
  creditorPostalAddress: BofaPostalAddress;
  creditorAccountNumber: string;
  creditorRoutingNumber: string;
  creditorBankName?: string;
}

export interface BofaPostalAddress {
  addressLine: string[];
  city: string;
  state?: string;
  postalCode?: string;
}
