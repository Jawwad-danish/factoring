import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum WorkerJobStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
}

export enum WorkerJobType {
  Report = 'REPORT',
  Cron = 'CRON',
}

@Entity({ tableName: 'worker_jobs' })
export class WorkerJobEntity extends BasicMutableEntity {
  @Enum({ items: () => WorkerJobType, nullable: false })
  @Index()
  type: WorkerJobType;

  @Property({ type: 'json', nullable: false, unique: false })
  payload: object;

  @Property({ type: 'uuid', default: null, nullable: true })
  correlationId: null | string;

  @Enum({
    items: () => WorkerJobStatus,
    nullable: false,
    default: WorkerJobStatus.Pending,
  })
  status: WorkerJobStatus;

  @Property({ nullable: false, default: 0 })
  attempts: number;

  @Property({ nullable: false, default: 3 })
  maxAttempts: number;

  @Property({ nullable: true })
  lastAttemptAt?: Date;

  @Property({ nullable: true })
  finishedAt?: Date;

  @Property({ type: 'text', nullable: true })
  errorMessage?: string;
}
