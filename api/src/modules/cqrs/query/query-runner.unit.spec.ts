import { mockToken } from '@core/test';
import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Query } from './data';
import { QueryRunner } from './query-runner';

class TestResult {}

class TestQuery extends Query<TestResult> {
  constructor() {
    super();
  }
}

describe('Query runner', () => {
  let queryRunner: QueryRunner;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryRunner],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    queryRunner = module.get(QueryRunner);
    queryBus = module.get(QueryBus);
  });

  it('Query runner should be defined', () => {
    expect(queryRunner).toBeDefined();
  });

  it('Query bus is called', async () => {
    const executeSpy = jest.spyOn(queryBus, 'execute');
    executeSpy.mockResolvedValueOnce(new TestResult());

    await queryRunner.run(new TestQuery());

    expect(executeSpy).toBeCalledTimes(1);
  });
});
