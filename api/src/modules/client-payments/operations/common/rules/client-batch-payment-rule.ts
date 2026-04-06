import { ClientBatchPaymentContext } from '../../../data';

export interface ClientBatchPaymentRule<P> {
  run(context: ClientBatchPaymentContext<P>): Promise<void>;
}
