import { CauseAwareError } from '@core/errors';

export class RegenerateDocsError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'invoice-regenerate-docs',
      `Could not refresh documents for invoice with id ${id}`,
      causingError,
    );
  }
}
