import { ReportName } from './report-name';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { QueryCriteria } from '../common/query-criteria.model';

export class ApprovedAgingReportCreateRequest extends BaseReportCreateRequest<ApprovedAgingReportCreateRequest> {
  name = ReportName.ApprovedAging;

  @Type(() => QueryCriteria)
  @IsOptional()
  @ValidateNested()
  criteria?: QueryCriteria;
}
