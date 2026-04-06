import { BaseModel, SortCriteria } from '@core/data';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

@Exclude()
export class FindInvoiceSortCriteria extends BaseModel<FindInvoiceSortCriteria> {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SortCriteria)
  clientUnderReviewTotal?: SortCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SortCriteria)
  clientPurchasedTotal?: SortCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SortCriteria)
  brokerUnderReviewTotal?: SortCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SortCriteria)
  brokerPurchasedTotal?: SortCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SortCriteria)
  hasIssues?: SortCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SortCriteria)
  daysSincePurchase?: SortCriteria;
}
