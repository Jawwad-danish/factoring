import Big from 'big.js';
import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export interface IsBigOptions {
  only: 'positive' | 'negative';
}

export function IsBig(
  options?: IsBigOptions,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (target: any, propertyKey: string) {
    registerDecorator({
      name: 'isBig',
      target: target.constructor,
      propertyName: propertyKey,
      constraints: [propertyKey],
      options: validationOptions,
      validator: {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: any, args?: ValidationArguments) {
          if (!(value instanceof Big)) {
            return false;
          }
          if (options?.only == 'positive' && value.lt(0)) {
            return false;
          }
          if (options?.only == 'negative' && value.gt(0)) {
            return false;
          }
          return true;
        },

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defaultMessage(validationArguments?: ValidationArguments): string {
          const messages = [`$property should have a valid value`];
          if (options?.only == 'positive') {
            messages.push('$property must be a positive number');
          }
          if (options?.only == 'negative') {
            messages.push('$property must be a positive number');
          }
          return messages.join('. ');
        },
      },
    });
  };
}
