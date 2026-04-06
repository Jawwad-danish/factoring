import { plainToInstance, Type } from 'class-transformer';
import { ValidateNested, validateSync } from 'class-validator';
import { validationExceptionFactory } from '../../errors';
import { ClassConstructor } from '../../types';
import { BaseModel } from '../common';
import { FilterCriteria } from './filter-criteria.model';
import { PageCriteria } from './page-criteria.model';
import { SortCriteria } from './sort-criteria.model';

export class QueryCriteria extends BaseModel<QueryCriteria> {
  @ValidateNested()
  @Type(() => PageCriteria)
  page: PageCriteria;

  @ValidateNested()
  @Type(() => SortCriteria)
  sort: SortCriteria[];

  @ValidateNested()
  @Type(() => FilterCriteria)
  filters: FilterCriteria[];

  mapFiltersToClass<C extends object>(classType: ClassConstructor<C>): C {
    if (!this.filters) {
      return {} as C;
    }
    const plain = this.filters.reduce((previous, filter) => {
      let accumulatorFilter = previous[filter.name];
      if (accumulatorFilter) {
        if (!Array.isArray(accumulatorFilter)) {
          accumulatorFilter = [accumulatorFilter];
        }
        accumulatorFilter.push({
          operator: filter.operator,
          value: filter.value,
        });
      } else {
        accumulatorFilter = {
          operator: filter.operator,
          value: filter.value,
        };
      }
      previous[filter.name] = accumulatorFilter;
      return previous;
    }, {});

    const instance = plainToInstance(classType, plain, {
      excludeExtraneousValues: true,
    });

    const errors = validateSync(instance, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw validationExceptionFactory(errors);
    }

    return instance;
  }
}
