import { Injectable } from '@nestjs/common';
import { UpdateInvoiceRequest } from '@module-invoices/data';
import {
  InvoiceExpeditedValidator,
  InvoiceNotDeletedValidator,
  InvoiceNotLockedValidator,
} from '../../common/validation/validators';
import {
  ClientUpdateOnPurchasedValidator,
  InvoiceStatusOnUpdateValidator,
  TransferTypeUpdateValidator,
} from './validators';
import { InvoiceValidationService } from '../../common/validation';
import { BrokerUpdateOnPurchasedValidator } from './validators/broker-update-on-purchased.validator';

@Injectable()
export class UpdateInvoiceValidationService extends InvoiceValidationService<UpdateInvoiceRequest> {
  constructor(
    clientUpdateOnPurchasedValidator: ClientUpdateOnPurchasedValidator<UpdateInvoiceRequest>,
    invoiceNotLockedValidator: InvoiceNotLockedValidator<UpdateInvoiceRequest>,
    brokerUpdateOnPurchasedValidator: BrokerUpdateOnPurchasedValidator<UpdateInvoiceRequest>,
    transferTypeUpdateValidator: TransferTypeUpdateValidator,
    invoiceExpeditedValidator: InvoiceExpeditedValidator<UpdateInvoiceRequest>,
  ) {
    super([
      new InvoiceNotDeletedValidator(),
      new InvoiceStatusOnUpdateValidator(),
      invoiceNotLockedValidator,
      clientUpdateOnPurchasedValidator,
      brokerUpdateOnPurchasedValidator,
      transferTypeUpdateValidator,
      invoiceExpeditedValidator,
    ]);
  }
}
