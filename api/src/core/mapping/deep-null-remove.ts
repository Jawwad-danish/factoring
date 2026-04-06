import { isDate, isNil } from 'lodash';
import { isArray, isObject } from './value-type-checker';

const handleObjectValue = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  const result = {};
  for (const [key, propertyDescriptor] of Object.entries(
    Object.getOwnPropertyDescriptors(value),
  )) {
    const propertyValue = propertyDescriptor.value;
    if (!isNil(propertyValue)) {
      Object.defineProperty(result, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: deepNullRemove(propertyDescriptor.value),
      });
    }
  }
  return result;
};

const handleArrayValue = (value: unknown[]): unknown[] => {
  const result: unknown[] = [];
  for (const item of value) {
    if (item !== null) {
      result.push(deepNullRemove(item));
    }
  }
  return result;
};

/**
 * Creates a copy of the input with no null value.
 * Instance properties will get converted to plain objects.
 *
 * @returns a copy of the input with no null values.
 */
export const deepNullRemove = (value: unknown): unknown => {
  if (isDate(value)) {
    return new Date(value);
  } else if (isObject(value)) {
    return handleObjectValue(<Record<string, unknown>>value);
  } else if (isArray(value)) {
    return handleArrayValue(<unknown[]>value);
  }
  return value;
};
