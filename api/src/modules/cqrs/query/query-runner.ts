import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Query } from './data';

@Injectable()
export class QueryRunner {
  constructor(private readonly queryBus: QueryBus) {}

  async run<RESULT>(query: Query<RESULT>): Promise<RESULT> {
    const result = await this.queryBus.execute<Query<RESULT>, RESULT>(query);
    if (result) {
      query.setResult(result);
    }
    return result;
  }
}
