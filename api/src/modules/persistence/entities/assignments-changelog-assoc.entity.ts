import { Entity, Property, ManyToOne, Index, Rel } from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { ClientBrokerAssignmentAssocEntity } from './client-broker-assignments-assoc.entity';

@Entity({ tableName: 'assignments_changelog_assoc' })
export class AssignmentsChangelogAssocEntity extends BasicEntity {
  @Property({ type: 'text', nullable: false })
  changelogNotes: string;

  @Property({ type: 'text', nullable: true })
  description: string;

  @Index()
  @ManyToOne({
    entity: () => ClientBrokerAssignmentAssocEntity,
  })
  assignmentAssocHistory: Rel<ClientBrokerAssignmentAssocEntity>;
}
