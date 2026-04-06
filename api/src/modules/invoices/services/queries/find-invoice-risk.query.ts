import { Query } from '@module-cqrs';
import { InvoiceRisk } from '../../data';

export class FindInvoiceRiskQuery extends Query<InvoiceRisk> {
  constructor(readonly id: string) {
    super();
  }
}
