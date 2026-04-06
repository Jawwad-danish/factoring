import { Entity, Property } from '@mikro-orm/core';
import { HistoryEntity } from './history.entity';

@Entity({ tableName: 'users_history' })
export class UserHistoryEntity extends HistoryEntity {
  @Property({
    nullable: true,
  })
  externalId: string | null;

  @Property({ nullable: false })
  email: string;

  @Property({ nullable: true })
  firstName: null | string;

  @Property({ nullable: true })
  lastName: null | string;
}
