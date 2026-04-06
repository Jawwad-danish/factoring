import {
  Cascade,
  Entity,
  Enum,
  Index,
  OneToOne,
  Property,
} from '@mikro-orm/core';
import { UserEntity } from './user.entity';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum EmployeeRole {
  AccountManager = 'account_manager',
  Underwriter = 'underwriter',
  CollectionsSpecialist = 'collections_specialist',
  Processor = 'processor',
  Master = 'master',
  Salesperson = 'salesperson',
}

@Entity({ tableName: 'employees' })
export class EmployeeEntity extends BasicMutableEntity {
  @Enum({
    items: () => EmployeeRole,
    nullable: true,
  })
  role: EmployeeRole | null;

  @Property({
    type: 'string',
    nullable: true,
  })
  extension: string | null;

  @Index()
  @OneToOne({
    entity: () => UserEntity,
    nullable: false,
    eager: true,
    cascade: [Cascade.ALL],
  })
  user: UserEntity;
}
