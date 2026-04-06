import { INestApplication } from '@nestjs/common';

export interface StepsInput {
  app: INestApplication<any>;
  runTransactionally: <T>(
    fn: (app: INestApplication<any>) => Promise<T>,
  ) => Promise<T>;
}
