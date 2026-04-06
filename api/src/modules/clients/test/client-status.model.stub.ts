import { UUID } from '@core/uuid';
import { AuthorityState, LightweightClient, InsuranceStatus } from '../data';

export const buildStubLightweightClient = (
  data?: Partial<LightweightClient>,
): LightweightClient => {
  const model = new LightweightClient({
    id: UUID.get(),
    insuranceStatus: InsuranceStatus.Active,
    authorityStatus: AuthorityState.Active,
  });
  Object.assign(model, data);
  return model;
};
