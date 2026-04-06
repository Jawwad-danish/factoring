import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export enum LoanTapeDateFilter {
  PROCESSED_DATE = 'processed_date',
  SUBMITTED_DATE = 'submitted_date',
}

export class LoanTapeReportRequest extends BaseReportCreateRequest<LoanTapeReportRequest> {
  @IsNotEmpty()
  @IsEnum(LoanTapeDateFilter)
  dateFilter!: LoanTapeDateFilter;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @IsOptional()
  @IsBoolean()
  includeDeclinedInvoices?: boolean;

  @IsOptional()
  @IsBoolean()
  includeLastUpdateDate?: boolean;

  @IsOptional()
  @IsBoolean()
  includeInvoiceUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  includePendingInvoices?: boolean;

  constructor(source?: Partial<LoanTapeReportRequest>) {
    super(source);
    this.name = ReportName.LoanTape;
  }
}
