import { LambdaInput, LambdaInvoice } from '../types';
import { run } from './implementation';

export const handler = async (
  event: LambdaInput<LambdaInvoice>,
): Promise<LambdaInput<LambdaInvoice>> => {
  console.log('Received event', JSON.stringify(event));

  const invoiceDocuments = await run(event.body.documents);
  return {
    body: {
      ...event.body,
      documents: invoiceDocuments,
    },
    headers: event.headers,
  };
};
