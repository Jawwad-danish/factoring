import { ChangeActionsRuleExecutor } from '@common';
import { BrokerPaymentContext } from '../../../data';

export abstract class BrokerPaymentRuleService<
  P,
> extends ChangeActionsRuleExecutor<BrokerPaymentContext<P>> {}
