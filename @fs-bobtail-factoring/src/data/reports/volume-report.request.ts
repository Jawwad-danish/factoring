import { BaseReportCreateRequest } from '../common';
import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportName } from './report-name';

export class VolumeReportRequest extends BaseReportCreateRequest<VolumeReportRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;
  
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;
  
  constructor(source?: Partial<VolumeReportRequest>) {
    super(source);
    this.name = ReportName.Volume;
  }
}
