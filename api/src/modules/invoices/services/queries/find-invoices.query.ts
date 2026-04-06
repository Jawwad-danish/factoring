import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { InvoiceEntity } from '@module-persistence/entities';

export interface FindInvoiceQueryResult {
  invoiceEntities: InvoiceEntity[];
  count: number;
  totalAmount: number;
}

export class FindInvoicesQuery extends Query<FindInvoiceQueryResult> {
  constructor(readonly criteria: QueryCriteria) {
    super();
  }
}
