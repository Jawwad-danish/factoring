import Big from 'big.js';
import {
  ValidateBy,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export interface IsBigRangeOptions {
  min?: number;
  max?: number;
  allowNull?: boolean;
}

export const IsBigRange = (
  options: IsBigRangeOptions,
  validationOptions?: ValidationOptions,
): PropertyDecorator => {
  return ValidateBy(
    {
      name: 'isBigRange',
      constraints: [options.min, options.max],
      validator: {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate: (value: any, args?: ValidationArguments) => {
          if (options?.allowNull && options.allowNull && value === null) {
            return true;
          }

          if (!(value instanceof Big)) {
            return false;
          }
          if (options?.min != null && value.lt(options.min)) {
            return false;
          }
          if (options?.max != null && value.gt(options.max)) {
            return false;
          }
          return true;
        },
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defaultMessage(validationArguments?: ValidationArguments): string {
          const messages = [`$property should have a valid value`];
          if (options?.min != null) {
            messages.push(`$property must be greater than $constraint1`);
          }
          if (options?.max != null) {
            messages.push('$property must be a less than $constraint2');
          }
          return messages.join('. ');
        },
      },
    },
    validationOptions,
  );
};
