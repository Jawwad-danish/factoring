import { QueryCriteria } from '@core/data';
import { QueryRunner } from '@module-cqrs';
import { Injectable } from '@nestjs/common';
import { FindAuditLogsQuery, FindAuditLogsQueryResult } from './queries';

@Injectable()
export class AuditLogService {
  constructor(private readonly queryRunner: QueryRunner) {}

  async findAll(criteria: QueryCriteria): Promise<FindAuditLogsQueryResult> {
    return await this.queryRunner.run(new FindAuditLogsQuery(criteria));
  }
}
