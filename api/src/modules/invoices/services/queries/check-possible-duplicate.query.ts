import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { Query } from '@module-cqrs';
import { DuplicateDetectionItem } from '../engines';

export class CheckPossibleDuplicateQuery extends Query<
  DuplicateDetectionItem[]
> {
  constructor(readonly request: CreateInvoiceRequest) {
    super();
  }
}
