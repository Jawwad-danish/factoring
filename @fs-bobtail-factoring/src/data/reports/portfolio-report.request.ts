import { BaseReportCreateRequest } from "../common";
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportName } from './report-name';

export class PortfolioReportRequest extends BaseReportCreateRequest<PortfolioReportRequest> {

  constructor(source?: Partial<PortfolioReportRequest>) {
    super(source);
    this.name = ReportName.Portfolio;
  }

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @IsOptional()
  @IsString()
  title?: string;
}
