import { Query } from '@mikro-orm/migrations';
import { UserEntity } from '@module-persistence';
import { BaseQueryGenerator } from './base-query-generator';

export type UserData = {
  id: string;
  externalId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
  created_by_id: string | null;
  updated_by_id: string | null;
};

export class UsersQueryGenerator extends BaseQueryGenerator {
  addUser(data: UserData): Query {
    return this.getQuery(
      this.driver
        .createQueryBuilder(UserEntity.name)
        .insert(data)
        .onConflict('email')
        .ignore(),
    );
  }

  deleteUser(userId: string): Query {
    return this.getQuery(
      this.driver.createQueryBuilder(UserEntity.name).delete({ id: userId }),
    );
  }
}
