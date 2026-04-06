import { Type } from '@mikro-orm/core';
import Big from 'big.js';

export class BigJsType extends Type<null | Big, null | number> {
  convertToDatabaseValue(value: null | Big): null | number {
    if (value == null) {
      return null;
    }
    return value.toNumber();
  }

  convertToJSValue(value: null | number): null | Big {
    if (value == null) {
      return null;
    }
    return new Big(value);
  }

  getColumnType(): string {
    return `numeric`;
  }
}
