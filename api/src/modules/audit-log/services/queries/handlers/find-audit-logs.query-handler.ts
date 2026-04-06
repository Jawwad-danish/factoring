import { BasicQueryHandler } from '@module-cqrs';
import { RecordStatus } from '@module-persistence/entities';
import { AuditLogRepository } from '@module-persistence/repositories';
import { QueryHandler } from '@nestjs/cqrs';
import { FindAuditLogsFilterCriteria } from '../../../data';
import {
  FindAuditLogsQuery,
  FindAuditLogsQueryResult,
} from '../find-audit-logs.query';
import { Injectable } from '@nestjs/common';

@QueryHandler(FindAuditLogsQuery)
@Injectable()
export class FindAuditLogsQueryHandler
  implements BasicQueryHandler<FindAuditLogsQuery>
{
  constructor(private readonly repository: AuditLogRepository) {}

  async execute({
    criteria,
  }: FindAuditLogsQuery): Promise<FindAuditLogsQueryResult> {
    const filterCriteria = criteria.mapFiltersToClass(
      FindAuditLogsFilterCriteria,
    );

    const [logs, count] = await this.repository.findAll(
      {
        type: filterCriteria.type.value,
        createdAt: {
          $gte: filterCriteria.startDate.value,
          $lte: filterCriteria.endDate.value,
        },
        recordStatus: RecordStatus.Active,
      },
      {
        orderBy: {
          createdAt: 'desc',
        },
        limit: criteria.page.limit,
        offset: criteria.page.getOffset(),
      },
    );
    return {
      logs,
      count,
    };
  }
}
