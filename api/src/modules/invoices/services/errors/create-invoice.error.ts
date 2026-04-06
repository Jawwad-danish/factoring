import { CauseAwareError } from '@core/errors';

export class CreateInvoiceError extends CauseAwareError {
  constructor(causingError: Error) {
    super('create-invoice', `Could not create invoice`, causingError);
  }
}
