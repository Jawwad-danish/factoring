export const ifPresent = <T>(
  value: undefined | null | T,
  defaultValue: T,
  valueProcessor: (value: T) => T = (notNullValue) => notNullValue,
) => {
  if (value == null) {
    return defaultValue;
  }
  return valueProcessor(value);
};
