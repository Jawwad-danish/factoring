import { DataMapperUtil } from '@common/mappers';
import {
  Criteria,
  PageResult,
  PaginationResult,
  QueryCriteria,
} from '@core/data';
import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { AuditLogMapper } from '../data';
import { AuditLogService } from '../services';
import { AuditLog } from '@fs-bobtail/factoring/data';

@Controller('audit-logs')
export class AuditLogController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly mapper: AuditLogMapper,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOkResponse({ type: PageResult<AuditLog> })
  async findAll(
    @Criteria({
      parseFilterValues: false,
    })
    criteria: QueryCriteria,
  ): Promise<PageResult<AuditLog>> {
    const result = await this.auditLogService.findAll(criteria);
    return new PageResult(
      await DataMapperUtil.asyncMapCollections(
        result.logs,
        this.mapper.entityToModel,
      ),
      new PaginationResult(
        criteria.page.page,
        criteria.page.limit,
        result.count,
      ),
    );
  }
}
