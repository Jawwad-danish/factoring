import { Injectable } from '@nestjs/common';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '../../../../../data';
import { InvoiceValidationService } from '../../common/validation/invoice-validation.service';
import { InvoiceNotDeletedValidator } from '../../common/validation/validators';
import {
  ChargebackValidator,
  CheckBrokerDeliveryOptionsValidator,
  CheckClientNoaValidator,
  CheckClientStatus,
  ClientBankAccountValidator,
  InvoiceStatusToPurchasedValidator,
  VerificationStatusValidator,
  WireAmountValidator,
} from './validators';

@Injectable()
export class PurchaseInvoiceValidationService extends InvoiceValidationService<PurchaseInvoiceRequest> {
  constructor(
    clientCheckStatusOnPurchaseValidator: CheckClientStatus,
    private readonly chargebackValidator: ChargebackValidator,
    verificationStatusValidator: VerificationStatusValidator,
    wireAmountValidator: WireAmountValidator,
    clientBankAccountValidator: ClientBankAccountValidator,
    checkBrokerDeliveryOptionsValidator: CheckBrokerDeliveryOptionsValidator,
    checkClientNoaValidator: CheckClientNoaValidator,
  ) {
    super([
      new InvoiceNotDeletedValidator(),
      new InvoiceStatusToPurchasedValidator(),
      wireAmountValidator,
      verificationStatusValidator,
      clientCheckStatusOnPurchaseValidator,
      clientBankAccountValidator,
      checkBrokerDeliveryOptionsValidator,
      checkClientNoaValidator,
    ]);
  }

  async validatePostPreparation(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<void> {
    await this.chargebackValidator.validate(context);
  }
}
