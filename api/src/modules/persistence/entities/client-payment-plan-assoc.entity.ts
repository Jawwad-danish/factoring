import { Entity, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { ClientFactoringConfigsEntity } from './client-factoring-config.entity';

@Entity({ tableName: 'client_payment_plan_assoc' })
export class ClientPaymentPlanAssocEntity extends BasicEntity {
  @Property({ type: 'text', nullable: true })
  note: null | string;

  @Property({ type: 'text', nullable: true })
  paymentPlan: null | string;

  @Index()
  @ManyToOne({
    entity: () => ClientFactoringConfigsEntity,
  })
  config: Rel<ClientFactoringConfigsEntity>;
}
