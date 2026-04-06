import {
  ValidationError,
  isBooleanString,
  isDateString,
  isNumberString,
} from 'class-validator';
import {
  FilterCriteria,
  FilterCriteriaValue,
  FilterOperator,
} from '../filter-criteria.model';

const PATTERN_SEPARATOR = ':';
const VALUE_SEPARATOR = ',';
const NULL_OPERATORS = [FilterOperator.NULL, FilterOperator.NOTNULL];

export interface CriteriaOptions {
  parseFilterValues: boolean;
}

// Example &filter=id:$eq:[uuid]&filter=status:$in:[active,inactive]
export const parseFilterQuery = (
  query: Record<string, unknown>,
  options: CriteriaOptions,
): FilterCriteria[] => {
  // Get filter criteria from either filter or filter[] parameter
  const filterParam = query.filter ?? query['filter[]'];

  if (!filterParam) {
    return [];
  }

  const filterQueryParams = Array.isArray(filterParam)
    ? filterParam
    : [filterParam];

  return filterQueryParams.map((param) => {
    const { name, operator, value } = mapToFilterCriteria(param, options);
    return new FilterCriteria({
      name: name,
      operator: operator as FilterOperator,
      value: value,
    });
  });
};

const mapToFilterCriteria = (
  criteria: string,
  options: CriteriaOptions,
): FilterCriteria => {
  const name = criteria.substring(0, criteria.indexOf(PATTERN_SEPARATOR));
  const operatorOffset = name.length + 1;
  const operator = criteria.substring(
    operatorOffset,
    criteria.substring(operatorOffset).indexOf(PATTERN_SEPARATOR) +
      operatorOffset,
  );
  const value = criteria.substring(operatorOffset + operator.length + 1);

  if (name === '' || operator === '' || value === '') {
    const error = new ValidationError();
    error.property = 'filter';
    error.value = criteria;
    error.constraints = {
      value: `Expected 'name${PATTERN_SEPARATOR}operator${PATTERN_SEPARATOR}[values]' pattern for criteria ${criteria}`,
    };
    throw error;
  }
  const parsedValue = parseFilterCriteriaValue(value, options);

  if (!NULL_OPERATORS.includes(operator as FilterOperator)) {
    if (
      !Array.isArray(parsedValue) &&
      [FilterOperator.IN, FilterOperator.NIN].includes(
        operator as FilterOperator,
      )
    ) {
      const error = new ValidationError();
      error.property = 'filter';
      error.value = criteria;
      error.constraints = {
        value: `Expected multiple values for operator '${operator}' for criteria ${criteria}. Please use $EQ or $NE for matching against singular values.`,
      };
      throw error;
    }
    if (
      Array.isArray(parsedValue) &&
      ![FilterOperator.IN, FilterOperator.NIN].includes(
        operator as FilterOperator,
      )
    ) {
      const error = new ValidationError();
      error.property = 'filter';
      error.value = criteria;
      error.constraints = {
        value: `Expected singular value for operator '${operator}' for criteria ${criteria}. Please use $IN or $NIN for matching against multiple values.`,
      };
      throw error;
    }
  }
  return { name, operator: operator as FilterOperator, value: parsedValue };
};

const parseFilterCriteriaValue = (
  rawValue: string,
  options: CriteriaOptions,
): FilterCriteriaValue | FilterCriteriaValue[] => {
  if (!rawValue.startsWith('[') || !rawValue.endsWith(']')) {
    const error = new ValidationError();
    error.property = 'filter';
    error.value = rawValue;
    error.constraints = {
      value: `Expected 'name${PATTERN_SEPARATOR}operator${PATTERN_SEPARATOR}[values]' pattern`,
    };
    throw error;
  }
  if (rawValue === '[]') {
    return [];
  }

  const values = rawValue
    .substring(1, rawValue.length - 1)
    .split(VALUE_SEPARATOR)
    .map((item) => {
      const trimmed = item.trim();
      if (!options.parseFilterValues) {
        return trimmed;
      }
      if (isNumberString(trimmed)) {
        return parseFloat(trimmed);
      } else if (isDateString(trimmed)) {
        return new Date(trimmed);
      } else if (isBooleanString(trimmed)) {
        return trimmed.toLowerCase() === 'true';
      }
      return trimmed;
    });
  return values.length === 1 ? values[0] : values;
};
