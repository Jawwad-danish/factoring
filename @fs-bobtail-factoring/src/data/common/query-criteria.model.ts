import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { BaseModel } from '../common';
import { FilterCriteria } from './filter-criteria.model';
import { PageCriteria } from './page-criteria.model';
import { SortCriteria } from './sort-criteria.model';

export class QueryCriteria extends BaseModel<QueryCriteria> {
  @ValidateNested()
  @Type(() => PageCriteria)
  page!: PageCriteria;

  @ValidateNested()
  @Type(() => SortCriteria)
  sort!: SortCriteria[];

  @ValidateNested()
  @Type(() => FilterCriteria)
  filters!: FilterCriteria[];
}
