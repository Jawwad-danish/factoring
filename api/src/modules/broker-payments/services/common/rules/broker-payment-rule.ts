import { ChangeActionsRule } from '@common';
import { BrokerPaymentContext } from '../../../data';

export interface BrokerPaymentRule<P>
  extends ChangeActionsRule<BrokerPaymentContext<P>> {}
