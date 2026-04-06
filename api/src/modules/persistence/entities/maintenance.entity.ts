import { Entity, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

@Entity({ tableName: 'maintenance' })
export class MaintenanceEntity extends BasicMutableEntity {
  @Property({
    nullable: false,
    comment: 'Is maintenance mode enabled',
  })
  isEnabled: boolean;

  @Property({
    nullable: true,
    comment: 'Maintenance message',
  })
  message: string;
}
