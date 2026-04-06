import {
  InvoiceCoverResultPayload,
  LambdaInvoice,
  LambdaInput,
} from '../types';
import { run } from './implementation';

export const handler = async (
  event: LambdaInput<LambdaInvoice>,
): Promise<LambdaInput<InvoiceCoverResultPayload>> => {
  const url = await run(event.body);
  console.log('Received event', JSON.stringify(event));
  return {
    body: { coverDocumentUrl: url },
    headers: event.headers,
  };
};
