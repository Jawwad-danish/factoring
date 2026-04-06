import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'firebase_tokens' })
export class FirebaseTokenEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({ entity: () => UserEntity, lazy: true, nullable: false })
  user!: UserEntity;

  @Property({ type: 'varchar' })
  token!: string;
}
