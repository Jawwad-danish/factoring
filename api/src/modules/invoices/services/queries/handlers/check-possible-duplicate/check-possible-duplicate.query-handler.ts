import {
  DuplicateDetectionEngine,
  DuplicateDetectionItem,
} from '@module-invoices';
import { InvoiceMapper } from '@module-invoices/data';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CheckPossibleDuplicateQuery } from '../../check-possible-duplicate.query';

@QueryHandler(CheckPossibleDuplicateQuery)
export class CheckPossibleDuplicateQueryHandler
  implements IQueryHandler<CheckPossibleDuplicateQuery>
{
  constructor(
    private readonly duplicateDetectionEngine: DuplicateDetectionEngine,
    private readonly mapper: InvoiceMapper,
  ) {}

  async execute(
    query: CheckPossibleDuplicateQuery,
  ): Promise<DuplicateDetectionItem[]> {
    const invoice = await this.mapper.createRequestToEntity(query.request);
    const result = await this.duplicateDetectionEngine.run(invoice);
    return result;
  }
}
