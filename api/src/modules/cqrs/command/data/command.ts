import { ICommand } from '@nestjs/cqrs';

export abstract class Command<TResult> implements ICommand {
  private result: null | TResult = null;

  setResult(value: TResult) {
    this.result = value;
  }

  getResult(): null | TResult {
    return this.result;
  }

  getName(): string {
    return this.constructor.name;
  }
}
