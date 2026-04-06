import { CauseAwareError } from '@core/errors';
import { TagDefinitionKey } from '@module-persistence/entities';
import { AssignInvoiceActivityRequest } from '../../data/web';

export class AssignInvoiceActivityError extends CauseAwareError {
  constructor(
    id: string,
    causingError: Error,
    readonly request: AssignInvoiceActivityRequest,
  ) {
    super(
      'assign-invoice-activity',
      `Could not assign activity to invoice with id ${id}`,
      causingError,
    );
  }

  skipObservability(): boolean {
    return (
      this.request.key === TagDefinitionKey.NOTE &&
      (this.request.note?.toLowerCase().includes('email') || false)
    );
  }
}
