import { RecordStatus, UserEntity } from '@module-persistence';
import { UUID } from '@core/uuid';

export const buildStubUserEntity = () => {
  const entity = new UserEntity();
  entity.id = UUID.get();
  entity.email = 'fakeEmail@example.com';
  entity.firstName = 'fakeFirstName';
  entity.lastName = 'fakeLastName';
  entity.externalId = UUID.get();
  entity.recordStatus = RecordStatus.Active;
  entity.createdAt = new Date();
  entity.updatedAt = new Date();
  return entity;
};
