import { RequestCommand } from '@module-cqrs';
import {
  CreatePaymentOrderRequest,
  PaymentOrder,
} from '@fs-bobtail/factoring/data';

export class CreatePaymentOrderCommand extends RequestCommand<
  CreatePaymentOrderRequest,
  PaymentOrder
> {
  constructor(request: CreatePaymentOrderRequest) {
    super(request);
  }
}
