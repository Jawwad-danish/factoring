import { ValidationService, Validator } from '@core/validation';
import { ClientBatchPaymentContext } from '../../../data';

export type ClientBatchPaymentValidator<P> = Validator<
  ClientBatchPaymentContext<P>
>;
export abstract class ClientBatchPaymentValidationService<
  P,
> extends ValidationService<ClientBatchPaymentContext<P>> {
  constructor(validators: Validator<ClientBatchPaymentContext<P>>[]) {
    super(validators);
  }
}
