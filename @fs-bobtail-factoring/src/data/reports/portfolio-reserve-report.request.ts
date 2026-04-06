import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export class PortoflioReserveReportRequest extends BaseReportCreateRequest<PortoflioReserveReportRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  constructor(source?: Partial<PortoflioReserveReportRequest>) {
    super(source);
    this.name = ReportName.PortfolioReserve;
  }
}
