import { ReportName } from './report-name';
import { BaseReportCreateRequest } from '../common';
import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class RollForwardRequest extends BaseReportCreateRequest<RollForwardRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  constructor(source?: Partial<RollForwardRequest>) {
    super(source);
    this.name = ReportName.RollForward;
  }
}
