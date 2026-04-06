import { ValidationOptions } from 'class-validator';
import { environment } from '../environment';

export const ProductionOnly = (
  validator: (validationOptions?: ValidationOptions) => PropertyDecorator,
  validationOptions?: ValidationOptions,
): PropertyDecorator => {
  if (environment.isProduction()) {
    return validator(validationOptions);
  }
  return () => {};
};
