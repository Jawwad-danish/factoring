import { RequestBuilder } from '@core/test';
import { PurchaseInvoiceRequest } from '../data';
import Big from 'big.js';

export class PurchaseInvoiceRequestBuilder extends RequestBuilder<PurchaseInvoiceRequest> {
  requestSupplier(): PurchaseInvoiceRequest {
    return new PurchaseInvoiceRequest({
      deduction: new Big(0),
    });
  }
}
