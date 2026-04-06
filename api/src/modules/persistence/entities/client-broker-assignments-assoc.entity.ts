import {
  Cascade,
  Collection,
  Entity,
  Enum,
  Index,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  Property,
  Rel,
} from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { AssignmentsChangelogAssocEntity } from './assignments-changelog-assoc.entity';
import {
  ClientBrokerAssignmentEntity,
  ClientBrokerAssignmentStatus,
} from './client-broker-assignment.entity';

@Entity({ tableName: 'client_broker_assignment_assoc' })
export class ClientBrokerAssignmentAssocEntity extends BasicEntity {
  @Property({ type: 'text', nullable: true })
  note: null | string;

  @Property({ type: 'text', nullable: true })
  changelogNotes: null | string;

  @Enum({
    items: () => ClientBrokerAssignmentStatus,
    nullable: true,
  })
  status: null | ClientBrokerAssignmentStatus;

  @Index()
  @ManyToOne({
    entity: () => ClientBrokerAssignmentEntity,
  })
  clientBrokerAssignment: Rel<ClientBrokerAssignmentEntity>;

  @Index()
  @OneToMany(
    () => AssignmentsChangelogAssocEntity,
    (changelog) => changelog.assignmentAssocHistory,
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
  changelogHistory = new Collection<AssignmentsChangelogAssocEntity>(this);
}
