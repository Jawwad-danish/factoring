import { ClientBatchPaymentContext } from '../../../data';
import { ClientBatchPaymentRule } from './client-batch-payment-rule';

export abstract class ClientBatchPaymentRuleService<P> {
  constructor(private readonly rules: ClientBatchPaymentRule<P>[]) {}

  async run(context: ClientBatchPaymentContext<P>): Promise<void> {
    for (const rule of this.rules) {
      await rule.run(context);
    }
  }
}
