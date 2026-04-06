import { Invoice } from '@fs-bobtail/factoring/data';
import { Query } from '@module-cqrs';

export class FindInvoiceQuery extends Query<Invoice> {
  constructor(readonly id: string) {
    super();
  }
}
