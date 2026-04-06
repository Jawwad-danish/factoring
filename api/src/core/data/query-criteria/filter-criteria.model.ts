import { IsEnum, IsString } from 'class-validator';
import { BaseModel } from '../common';

export enum FilterStrategyOps {
  AND = 'AND',
  OR = 'OR',
}
export enum FilterOperator {
  EQ = '$eq',
  GT = '$gt',
  GTE = '$gte',
  IN = '$in',
  LT = '$lt',
  LTE = '$lte',
  NE = '$ne',
  NIN = '$nin',
  NULL = '$null',
  NOTNULL = '$notnull',
  ILIKE = '$ilike',
}

export type FilterCriteriaValue = string | Date | boolean | number;

export class FilterCriteria extends BaseModel<FilterCriteria> {
  @IsString()
  name: string;

  @IsEnum(FilterOperator)
  operator: FilterOperator;

  value: FilterCriteriaValue | FilterCriteriaValue[];
}

export class FilterStrategy extends BaseModel<FilterStrategy> {
  filterMode: FilterStrategyOps;
}
