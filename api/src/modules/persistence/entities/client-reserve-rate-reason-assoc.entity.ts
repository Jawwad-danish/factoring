import { Entity, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import Big from 'big.js';
import { BasicEntity } from './basic.entity';
import { BigJsType } from './big.type';
import { ClientFactoringConfigsEntity } from './client-factoring-config.entity';
import { ClientReserveRateReasonEntity } from './client-reserve-rate-reason.entity';

@Entity({ tableName: 'client_reserve_rate_reasons_assoc' })
export class ClientReserveRateReasonAssocEntity extends BasicEntity {
  @Property({ type: 'varchar', nullable: false })
  note: string;

  @Property({ type: BigJsType, nullable: false })
  reserveRatePercentage: Big;

  @Index()
  @ManyToOne({
    entity: () => ClientReserveRateReasonEntity,
    eager: true,
  })
  reserveRateReason: Rel<ClientReserveRateReasonEntity>;

  @Index()
  @ManyToOne({
    entity: () => ClientFactoringConfigsEntity,
  })
  config: Rel<ClientFactoringConfigsEntity>;
}
