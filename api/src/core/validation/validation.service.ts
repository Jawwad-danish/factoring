import { ValidationError, ValidationErrors, Validator } from './validator';

export interface ValidationOptions {
  runAll: boolean;
}

export abstract class ValidationService<TContext> {
  constructor(private readonly validators: Validator<TContext>[]) {}

  async validate(
    context: TContext,
    options?: ValidationOptions,
  ): Promise<void> {
    if (options?.runAll) {
      const errors: Error[] = [];
      for (const validator of this.validators) {
        try {
          await validator.validate(context);
        } catch (error) {
          errors.push(ValidationError.wrapping(error));
        }
      }
      throw new ValidationErrors(errors);
    }

    for (const validator of this.validators) {
      try {
        await validator.validate(context);
      } catch (error) {
        throw ValidationError.wrapping(error);
      }
    }
  }
}
