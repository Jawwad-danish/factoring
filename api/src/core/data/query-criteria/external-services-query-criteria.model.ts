import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryCriteria } from './query-criteria.model';
import { FilterStrategy } from './filter-criteria.model';

export class ExternalServicesQueryCriteria extends QueryCriteria {
  @ValidateNested()
  @Type(() => FilterStrategy)
  filterStrategy?: FilterStrategy;
}
