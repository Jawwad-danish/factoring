import { Entity, Property, Unique } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

@Entity({ tableName: 'factoring_companies' })
export class FactoringCompanyEntity extends BasicMutableEntity {
  @Property({ type: 'varchar', nullable: false })
  @Unique()
  name: string;
}
