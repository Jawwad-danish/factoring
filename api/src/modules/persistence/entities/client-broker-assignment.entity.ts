import {
  Cascade,
  Collection,
  Entity,
  Enum,
  Index,
  LoadStrategy,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { ClientBrokerAssignmentAssocEntity } from './client-broker-assignments-assoc.entity';

export enum ClientBrokerAssignmentStatus {
  Sent = 'sent',
  Verified = 'verified',
  Released = 'released',
}

@Entity({ tableName: 'client_broker_assignments' })
export class ClientBrokerAssignmentEntity extends BasicMutableEntity {
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Property({ type: 'uuid', nullable: false })
  brokerId: string;

  @Enum({
    items: () => ClientBrokerAssignmentStatus,
    nullable: false,
  })
  status: ClientBrokerAssignmentStatus;

  @Index()
  @OneToMany(
    () => ClientBrokerAssignmentAssocEntity,
    (assoc) => assoc.clientBrokerAssignment,
    {
      cascade: [Cascade.ALL],
      lazy: true,
      orphanRemoval: true,
      orderBy: {
        createdAt: 'desc',
      },
      strategy: LoadStrategy.SELECT_IN,
    },
  )
  assignmentHistory = new Collection<ClientBrokerAssignmentAssocEntity>(this);
}
