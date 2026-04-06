import { UUID } from '@core/uuid';
import { TagDefinition } from '@fs-bobtail/factoring/data';
import { buildStubUser } from '@module-common/test';
import {
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
} from '@module-persistence/entities';

export const buildStubTagDefinition = (
  key: TagDefinitionKey = TagDefinitionKey.MISSING_RECEIVER_SIGNATURE,
): TagDefinition => {
  const user = buildStubUser();
  return new TagDefinition({
    id: UUID.get(),
    key: key,
    name: 'Missing signature',
    level: TagDefinitionLevel.Error,
    visibility: TagDefinitionVisibility.All,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: user,
    updatedBy: user,
  });
};
