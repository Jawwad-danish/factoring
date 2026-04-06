import { Enum, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { RecordStatus } from '../entities';

export enum OperationType {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export class HistoryEntity {
  @PrimaryKey({
    type: 'uuid',
    defaultRaw: 'uuid_generate_v4()',
  })
  id: string;

  @Index()
  @Property({
    type: 'timestamp',
    nullable: false,
  })
  createdAt: Date = new Date();

  @Property({
    type: 'uuid',
    nullable: false,
  })
  createdById: string;

  @Enum({
    items: () => RecordStatus,
    default: RecordStatus.Active,
    nullable: false,
  })
  recordStatus: RecordStatus = RecordStatus.Active;

  @Property({
    type: 'uuid',
    nullable: false,
  })
  @Index()
  entityId: string;

  @Index()
  @Property({
    type: 'timestamp',
    nullable: false,
  })
  entityCreatedAt: Date = new Date();

  @Enum({
    items: () => RecordStatus,
    default: RecordStatus.Active,
    nullable: false,
  })
  entityRecordStatus: RecordStatus = RecordStatus.Active;

  @Enum({
    items: () => OperationType,
    default: null,
    nullable: true,
  })
  operationType: OperationType | null = null;
}
