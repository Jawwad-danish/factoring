import { AWSModule } from '@module-aws';
import { buildConvertAPIClient } from '../common/convert';
import { createLambdaNestContext } from '../common/nest-context';
import {
  InvoiceCoverResultPayload,
  CombineResultPayload,
  LambdaInvoice,
  LambdaInput,
} from '../types';
import { run } from './implementation';

const initLambdaContext = async () => {
  const app = await createLambdaNestContext(AWSModule);
  const convert = await buildConvertAPIClient(app);
  return { app, convert };
};

const init = initLambdaContext();

export const handler = async (
  event: LambdaInput<InvoiceCoverResultPayload | LambdaInvoice>[],
): Promise<LambdaInput<CombineResultPayload>> => {
  console.log('Received event', JSON.stringify(event));
  const context = await init;
  const bodies = event.map((e) => e.body);
  const combineResult = await run(context.app, context.convert, bodies);
  return {
    body: combineResult,
    headers: event[0].headers,
  };
};
