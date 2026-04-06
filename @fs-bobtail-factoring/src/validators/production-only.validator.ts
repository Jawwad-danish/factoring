import { ValidationOptions } from "class-validator";
import { Environment } from "../environment";

export const ProductionOnly = (
  validator: (validationOptions?: ValidationOptions) => PropertyDecorator,
  validationOptions?: ValidationOptions
): PropertyDecorator => {
  if (Environment.isProduction()) {
    return validator(validationOptions);
  }
  return () => {};
};
