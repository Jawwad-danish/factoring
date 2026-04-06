import { LoadStrategy, ManyToOne, Property } from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { UserEntity } from './user.entity';

export class BasicMutableEntity extends BasicEntity {
  @Property({
    type: 'timestamp',
    length: 3,
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  @ManyToOne({
    entity: () => UserEntity,
    lazy: true,
    strategy: LoadStrategy.JOINED,
  })
  updatedBy?: UserEntity;
}
