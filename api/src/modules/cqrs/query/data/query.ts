import { IQuery } from '@nestjs/cqrs';

export abstract class Query<RESULT> implements IQuery {
  private result: null | RESULT = null;

  setResult(value: RESULT) {
    this.result = value;
  }

  getResult(): null | RESULT {
    return this.result;
  }
}
