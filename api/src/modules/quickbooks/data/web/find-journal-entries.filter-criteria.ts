import { BaseModel, FilterOperator } from '@core/data';
import {
  QuickbooksJournalEntryStatus,
  QuickbooksJournalEntryType,
} from '@module-persistence';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TypeFilterCriteria extends BaseModel<TypeFilterCriteria> {
  @Expose()
  @IsEnum(QuickbooksJournalEntryType)
  value: QuickbooksJournalEntryType | QuickbooksJournalEntryType[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.IN])
  operator: FilterOperator;
}

export class StatusFilterCriteria extends BaseModel<StatusFilterCriteria> {
  @Expose()
  @IsEnum(QuickbooksJournalEntryStatus)
  value: QuickbooksJournalEntryStatus | QuickbooksJournalEntryStatus[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.IN])
  operator: FilterOperator;
}

export class BusinessDayFilterCriteria extends BaseModel<BusinessDayFilterCriteria> {
  @Expose()
  @IsString()
  @Type(() => String)
  value: string;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class FindJournalEntriesFilterCriteria extends BaseModel<FindJournalEntriesFilterCriteria> {
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
  @Type(() => BusinessDayFilterCriteria)
  businessDay?: BusinessDayFilterCriteria;
}
