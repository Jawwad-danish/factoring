import { BaseModel, FilterOperator } from '@core/data';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, ValidateNested } from 'class-validator';

export enum ReserveReasonFilter {
  NonPayment = 'nonpayment',
  Shortpay = 'shortpay',
  Overpay = 'overpay',
  Chargeback = 'chargeback',
  Adjustment = 'adjustment',
}
export class ReasonFilterCriteria extends BaseModel<ReasonFilterCriteria> {
  @Expose()
  @IsEnum(ReserveReasonFilter)
  value: ReserveReasonFilter;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

@Exclude()
export class FindReservesFilterCriteria extends BaseModel<FindReservesFilterCriteria> {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ReasonFilterCriteria)
  reason?: ReasonFilterCriteria;
}
