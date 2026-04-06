import { NotFoundException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ClassConstructor } from '../types';

export class ErrorFactory {
  static notFound(
    targetName: string,
    propertyName: string,
    propertyValue: string,
  ): NotFoundException {
    return new NotFoundException(
      `${targetName} with ${propertyName} ${propertyValue} not found`,
    );
  }

  static notFoundById(
    entityName: string,
    propertyValue: string,
  ): NotFoundException {
    return this.notFound(entityName, 'id', propertyValue);
  }

  static validateType(
    type: ClassConstructor<any>,
    body?: unknown,
  ): ValidationError {
    const error = new ValidationError();
    error.property = 'body';
    error.target = {
      body: body,
    };
    error.constraints = {
      type: `Response body is not of type ${type.name}`,
    };
    return error;
  }

  static validateProperty<T extends object, K extends keyof T>(
    target: T,
    property: K,
    expectedValue: T[K],
  ): ValidationError {
    const error = new ValidationError();
    error.property = property as string;
    error.target = target;
    error.constraints = {
      value: `Expected ${expectedValue}`,
    };
    return error;
  }

  static validateProperties<T extends object, K extends keyof T>(
    target: T,
    properties: Array<[K, T[K]]>,
  ): ValidationError[] {
    const errors = properties.map((property) => {
      const error = new ValidationError();
      error.property = property[0] as string;
      error.target = target;
      error.constraints = {
        value: `Expected ${property[1]}`,
      };
      return error;
    });
    return errors;
  }
}
