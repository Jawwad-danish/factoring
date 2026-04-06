import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { BaseModel, FilterOperator } from '@core/data';
import { PaymentType } from '@module-persistence';

export class TypeFilterCriteria extends BaseModel<TypeFilterCriteria> {
  @Expose()
  @IsEnum(PaymentType)
  value: PaymentType | PaymentType[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.IN])
  operator: FilterOperator;
}

export class StatusFilterCriteria extends BaseModel<StatusFilterCriteria> {
  @Expose()
  value: string | string[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.IN])
  operator: FilterOperator;
}

export class CreatedAtFilterCriteria extends BaseModel<CreatedAtFilterCriteria> {
  @Expose()
  @IsDate()
  @Type(() => Date)
  value: Date;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([
    FilterOperator.GT,
    FilterOperator.LT,
    FilterOperator.GTE,
    FilterOperator.LTE,
  ])
  operator: FilterOperator;
}

export class ClientIdFilterCriteria extends BaseModel<ClientIdFilterCriteria> {
  @Expose()
  @IsUUID(4, { each: true })
  value: string | string[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.IN])
  operator: FilterOperator;
}

export class FindCompletedTransfersFilterCriteria extends BaseModel<FindCompletedTransfersFilterCriteria> {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientIdFilterCriteria)
  clientId?: ClientIdFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => TypeFilterCriteria)
  type?: TypeFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => StatusFilterCriteria)
  status?: StatusFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatedAtFilterCriteria)
  createdAt?: CreatedAtFilterCriteria | CreatedAtFilterCriteria[];
}
