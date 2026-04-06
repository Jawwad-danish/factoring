import { UUID } from '@core/uuid';
import { ActivityLog } from '@fs-bobtail/factoring/data';
import { buildStubTagDefinition } from '@module-tag-definitions/test';
import { buildStubUser } from '@module-common/test';

export const buildStubActivityLog = (): ActivityLog => {
  return new ActivityLog({
    id: UUID.get(),
    note: 'note',
    tagDefinition: buildStubTagDefinition(),
    payload: { body: true },
    createdAt: new Date(),
    createdBy: buildStubUser(),
  });
};
