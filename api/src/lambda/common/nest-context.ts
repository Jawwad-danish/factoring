import { NestFactory } from '@nestjs/core';
import { LambdaLogger } from '../../modules/logging/lambda-logging.service';

type T = typeof NestFactory.createApplicationContext;
type Params = Parameters<T>;
export async function createLambdaNestContext(
  ...params: Params
): Promise<ReturnType<T>> {
  const app = await NestFactory.createApplicationContext(...params);
  app.useLogger(new LambdaLogger());
  return app;
}
