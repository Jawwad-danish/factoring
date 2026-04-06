import { BaseModel, FilterOperator } from '@core/data';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class InvoiceIdFilterCriteria extends BaseModel<InvoiceIdFilterCriteria> {
  @Expose()
  @IsUUID()
  value: string;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

@Exclude()
export class FindProcessingNotesFilterCriteria extends BaseModel<FindProcessingNotesFilterCriteria> {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceIdFilterCriteria)
  invoiceId?: InvoiceIdFilterCriteria;
}
