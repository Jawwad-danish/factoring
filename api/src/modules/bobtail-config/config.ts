import { isBoolean, isNumber, isString } from 'lodash';
import { ParseError } from './errors';

export class Config {
  constructor(private readonly key: string, private readonly value: any) {}

  hasValue(): boolean {
    return this.value != null;
  }

  asString(): string {
    if (isString(this.value)) {
      return <string>this.value;
    }
    return `${this.value}`;
  }

  asNumber(): number {
    if (isNumber(this.value)) {
      return <number>this.value;
    }
    try {
      const result = parseInt(<string>this.value, 10);
      if (Number.isNaN(result)) {
        throw new ParseError('Result is NaN');
      }
      return result;
    } catch (error) {
      throw new ParseError(
        `Could not parse environment variable '${this.key}' as number`,
        error,
      );
    }
  }

  asBoolean(): boolean {
    if (isBoolean(this.value)) {
      return <boolean>this.value;
    }
    if (isString(this.value)) {
      return this.value.toLowerCase() === 'true';
    }
    return Boolean(this.value);
  }

  asParsedJson(): any {
    return typeof this.value === 'object'
      ? this.value
      : JSON.parse(<string>this.value);
  }

  asRaw(): any {
    return this.value;
  }

  getKey(): string {
    return this.key;
  }
}
