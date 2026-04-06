import { Reason, CauseAwareError } from '../errors';

export interface Validator<C> {
  /**
   * @throws ValidationError
   * @param context the data that needs to be validated
   */
  validate(context: C): Promise<void>;
}

export class ValidationError extends CauseAwareError {
  getReason(): Reason {
    return Reason.Validation;
  }

  static wrapping(error: Error): ValidationError {
    if (error instanceof ValidationError) {
      return error;
    }
    const message = error.message ?? '';
    return new ValidationError('wrapping-validation-error', message, error);
  }
}

export class ValidationErrors extends CauseAwareError {
  constructor(readonly errors: Error[]) {
    super('validation-errors', 'Multiple validation failed');
  }

  getReason(): Reason {
    return Reason.Validation;
  }
}
