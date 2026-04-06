import { CombineResultPayload, LambdaInvoice, LambdaInput } from '../types';
import { run } from './implementation';

export const handler = async (
  event: LambdaInput<CombineResultPayload>,
): Promise<LambdaInput<LambdaInvoice>> => {
  console.log('Received event:', JSON.stringify(event));
  const invoice = await run(event);
  return {
    body: invoice,
    headers: event.headers,
  };
};
