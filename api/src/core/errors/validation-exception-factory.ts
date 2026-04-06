import { ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

const validationPipe = new ValidationPipe({ validateCustomDecorators: true });
const exceptionFactory = validationPipe.createExceptionFactory();

export const validationExceptionFactory = (
  error: ValidationError | ValidationError[],
): void => {
  if (Array.isArray(error)) {
    throw exceptionFactory(error);
  }
  throw exceptionFactory([error]);
};
