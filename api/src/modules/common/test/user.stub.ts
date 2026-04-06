import { User } from '@core/data';
import { UUID } from '@core/uuid';

export const buildStubUser = (data?: Partial<User>): User => {
  const user = new User();
  user.id = UUID.get();
  user.firstName = 'test';
  user.lastName = 'bobtail';
  user.externalId = UUID.get();
  user.email = 'test@bobtail.com';
  user.createdAt = new Date();
  user.updatedAt = new Date();
  Object.assign(user, data);
  return user;
};
