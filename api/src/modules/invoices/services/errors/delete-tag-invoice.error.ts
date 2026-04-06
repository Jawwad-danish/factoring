import { CauseAwareError } from '@core/errors';

export class DeleteTagInvoiceError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'delete-invoice-activity',
      `Could not delete invoice activity from invoice with id ${id}`,
      causingError,
    );
  }
}
