import { ValidationService, Validator } from '@core/validation';
import { BrokerPaymentContext } from '../../../data';

export type BrokerPaymentValidator<P> = Validator<BrokerPaymentContext<P>>;

export abstract class BrokerPaymentValidationService<
  P,
> extends ValidationService<BrokerPaymentContext<P>> {
  constructor(validators: Validator<BrokerPaymentContext<P>>[]) {
    super(validators);
  }
}
