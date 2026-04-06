import { Entity, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import Big from 'big.js';
import { BasicEntity } from './basic.entity';
import { BigJsType } from './big.type';
import { ClientFactoringConfigsEntity } from './client-factoring-config.entity';

@Entity({ tableName: 'client_limit_assoc' })
export class ClientLimitAssocEntity extends BasicEntity {
  @Property({ type: 'varchar', nullable: false })
  note: string;

  @Property({ type: BigJsType, nullable: true })
  clientLimitAmount: null | Big;

  @Index()
  @ManyToOne({
    entity: () => ClientFactoringConfigsEntity,
  })
  config: Rel<ClientFactoringConfigsEntity>;
}
