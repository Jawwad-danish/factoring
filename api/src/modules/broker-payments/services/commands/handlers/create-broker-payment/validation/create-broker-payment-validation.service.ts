import { Injectable } from '@nestjs/common';
import { CreateBrokerPaymentRequest } from '../../../../../data';
import { BrokerPaymentValidationService } from '../../../../common';
import {
  InvoiceClientPaymentStatusValidator,
  InvoiceStatusPurchasedValidator,
  NonPaymentReasonValidator,
} from './validators';

@Injectable()
export class CreateBrokerPaymentValidationService extends BrokerPaymentValidationService<CreateBrokerPaymentRequest> {
  constructor(
    invoiceCheckStatusOnCreateValidator: InvoiceStatusPurchasedValidator,
    addNonPaymentTagValidator: NonPaymentReasonValidator,
    checkClientPaymentStatusValidator: InvoiceClientPaymentStatusValidator,
  ) {
    super([
      invoiceCheckStatusOnCreateValidator,
      addNonPaymentTagValidator,
      checkClientPaymentStatusValidator,
    ]);
  }
}
