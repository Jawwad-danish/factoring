import { Broker } from '..';

export function isBrokerNotFound(broker: Broker | string | null): boolean {
  return broker === null;
}
