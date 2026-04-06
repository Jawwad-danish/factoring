import { AWSModule } from '../../modules/aws/aws.module';
import { buildConvertAPIClient } from '../common/convert';
import { createLambdaNestContext } from '../common/nest-context';
import { LambdaInput, LambdaInvoice } from '../types';
import { run } from './implementation';

/**
 * The returned promise from init is stored at module scope
 * and then awaited upon inside the handler.
 * This ensures that the function can safely continue.
 * Subsequent invocations will proceed immediately as they
 * will be awaiting on an already resolved promise.
 */
const initLambdaContext = async () => {
  const app = await createLambdaNestContext(AWSModule);
  const convert = await buildConvertAPIClient(app);
  return { app, convert };
};

const init = initLambdaContext();

export const handler = async (
  event: LambdaInput<LambdaInvoice>,
): Promise<LambdaInput<LambdaInvoice>> => {
  console.log('Received event', JSON.stringify(event));

  const context = await init;
  const invoiceDocuments = await run(event.body.documents, context.convert);
  return {
    body: {
      ...event.body,
      documents: invoiceDocuments,
    },
    headers: event.headers,
  };
};
