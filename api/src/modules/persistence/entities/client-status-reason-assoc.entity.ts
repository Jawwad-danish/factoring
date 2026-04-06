import { Entity, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { ClientFactoringConfigsEntity } from './client-factoring-config.entity';
import { ClientStatusReasonConfigEntity } from './client-status-reason-configuration.entity';

@Entity({ tableName: 'client_status_reasons_assoc' })
export class ClientStatusReasonAssocEntity extends BasicEntity {
  @Property({ type: 'text', nullable: false })
  note: string;

  @Index({
    name: 'client_status_reasons_assoc_client_status_reason_config_id_inde',
  })
  @ManyToOne({
    entity: () => ClientStatusReasonConfigEntity,
  })
  clientStatusReasonConfig: Rel<ClientStatusReasonConfigEntity>;

  @Index()
  @ManyToOne({
    entity: () => ClientFactoringConfigsEntity,
  })
  config: Rel<ClientFactoringConfigsEntity>;
}
