import { CauseAwareError } from '@core/errors';

const friendlyErrorMessage = (id: string, causingError: Error) => {
  let message = 'Could not update user';
  if (causingError) {
    message = `${message}. ${causingError.message}`;
  } else {
    message = `${message} with id ${id}`;
  }
  return message;
};

export class UpdateUserError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super('update-user', friendlyErrorMessage(id, causingError), causingError);
  }
}
