import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum PeruseJobType {
  BulkClassification = 'bulk_classification',
  Classification = 'classification',
  VerifyLoad = 'verify_load',
  CreateLoad = 'create_load',
}

export enum PeruseStatus {
  InProgress = 'in_progress',
  Done = 'done',
  Error = 'error',
}

@Entity({ tableName: 'peruse_jobs' })
export class PeruseJobEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'uuid', nullable: false, unique: false })
  invoiceId: string;

  @Property({ type: 'uuid', nullable: false, unique: true })
  jobId: string;

  @Enum({
    items: () => PeruseJobType,
    nullable: false,
  })
  type: PeruseJobType;

  @Enum({
    items: () => PeruseStatus,
    nullable: false,
    default: PeruseStatus.InProgress,
  })
  status: PeruseStatus;

  @Property({ type: 'json', nullable: true, unique: false })
  response: null | any;

  @Property({ type: 'json', nullable: false, unique: false })
  request: any;
}
