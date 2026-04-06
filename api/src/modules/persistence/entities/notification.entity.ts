import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum NotificationMedium {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity({ tableName: 'notifications' })
export class NotificationEntity extends BasicMutableEntity {
  @Property({ type: 'uuid', nullable: false })
  @Index()
  clientId: string;

  @Enum(() => NotificationMedium)
  medium: NotificationMedium;

  @Property({ nullable: true })
  recipient?: string;

  @Property({ nullable: true })
  sentAt?: Date;

  @Property({ type: 'varchar', nullable: true })
  subject?: string;

  @Property({ type: 'text', nullable: false })
  message: string;

  @Enum(() => NotificationStatus)
  status: NotificationStatus = NotificationStatus.PENDING;
}
