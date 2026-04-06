import { Entity, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import Big from 'big.js';
import { BasicEntity } from './basic.entity';
import { BigJsType } from './big.type';
import { ClientFactoringConfigsEntity } from './client-factoring-config.entity';
import { ClientFactoringRateReasonEntity } from './client-factoring-rate-reason.entity';

@Entity({ tableName: 'client_factoring_rate_reasons_assoc' })
export class ClientFactoringRateReasonAssocEntity extends BasicEntity {
  @Property({ type: 'varchar', nullable: false })
  note: string;

  @Property({ type: BigJsType, nullable: false })
  factoringRatePercentage: Big;

  @Index()
  @ManyToOne({
    entity: () => ClientFactoringRateReasonEntity,
    eager: true,
  })
  reason: Rel<ClientFactoringRateReasonEntity>;

  @Index()
  @ManyToOne({
    entity: () => ClientFactoringConfigsEntity,
  })
  config: Rel<ClientFactoringConfigsEntity>;
}
