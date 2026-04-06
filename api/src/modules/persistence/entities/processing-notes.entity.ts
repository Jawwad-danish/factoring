import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum ProcessingNotesStatus {
  Active = 'active',
  Archived = 'archived',
}

@Entity({ tableName: 'processing_notes' })
export class ProcessingNotesEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'uuid', nullable: true })
  clientId?: string;

  @Index()
  @Property({ type: 'uuid', nullable: true })
  brokerId?: string;

  @Enum({
    items: () => ProcessingNotesStatus,
    default: ProcessingNotesStatus.Active,
    nullable: false,
  })
  status: ProcessingNotesStatus;

  @Property({
    type: 'text',
    nullable: false,
  })
  notes: string;
}
