import { Entity, Index, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

@Entity({ tableName: 'client_success_teams' })
export class ClientSuccessTeamEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'varchar', nullable: false, unique: true })
  name: string;
}
