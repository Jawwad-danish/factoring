import { BaseModel, FilterOperator } from '@core/data';
import { AuditLogType } from '@module-persistence';
import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsDefined,
  IsEnum,
  IsIn,
  ValidateNested,
} from 'class-validator';

export class DateCriteria extends BaseModel<DateCriteria> {
  @Expose()
  @IsDate()
  @Type(() => Date)
  value: Date;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class AuditLogTypeCriteria extends BaseModel<AuditLogTypeCriteria> {
  @Expose()
  @IsEnum(AuditLogType)
  value: AuditLogType;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class FindAuditLogsFilterCriteria extends BaseModel<FindAuditLogsFilterCriteria> {
  @Expose()
  @IsDefined()
  @ValidateNested()
  @Type(() => AuditLogTypeCriteria)
  type: AuditLogTypeCriteria;

  @Expose()
  @IsDefined()
  @ValidateNested()
  @Type(() => DateCriteria)
  startDate: DateCriteria;

  @Expose()
  @IsDefined()
  @ValidateNested()
  @Type(() => DateCriteria)
  endDate: DateCriteria;
}
