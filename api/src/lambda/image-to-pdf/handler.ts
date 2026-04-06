import { AWSModule } from '@module-aws';
import { buildFilestackClient } from '../common/filestack';
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
  const filestack = await buildFilestackClient(app);
  return { app, filestack };
};

const initClient = initLambdaContext();

export const handler = async (
  event: LambdaInput<LambdaInvoice>,
): Promise<LambdaInput<LambdaInvoice>> => {
  console.log('Received event', JSON.stringify(event));

  const context = await initClient;
  const invoiceDocuments = await run(event.body.documents, context.filestack);
  return {
    body: {
      ...event.body,
      documents: invoiceDocuments,
    },
    headers: event.headers,
  };
};
