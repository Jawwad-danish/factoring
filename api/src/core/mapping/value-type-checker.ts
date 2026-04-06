const PRIMITIVE_TYPES = ['boolean', 'number', 'bigint', 'string', 'symbol'];

export const isObject = (value: unknown): boolean => {
  return typeof value === 'object' && !Array.isArray(value);
};

export const isArray = (value: unknown): boolean => {
  return Array.isArray(value);
};

export const isDate = (value: unknown): boolean => {
  return value instanceof Date;
};

export const isPrimitive = (value: unknown): boolean => {
  if (PRIMITIVE_TYPES.includes(typeof value)) {
    return true;
  }
  return false;
};
