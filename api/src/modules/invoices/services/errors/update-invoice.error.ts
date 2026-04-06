import { CauseAwareError } from '@core/errors';

const friendlyErrorMessage = (id: string, causingError: Error) => {
  let message = 'Could not update invoice';
  if (causingError) {
    message = `${message}. ${causingError.message}`;
  } else {
    message = `${message} with id ${id}`;
  }
  return message;
};

export class UpdateInvoiceError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'update-invoice',
      friendlyErrorMessage(id, causingError),
      causingError,
    );
  }
}
