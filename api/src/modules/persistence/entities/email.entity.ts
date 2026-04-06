import { ArrayType, Entity, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

@Entity({ tableName: 'emails' })
export class EmailEntity extends BasicMutableEntity {
  @Property({ type: 'varchar', nullable: false })
  externalIdentifier: string;

  @Property({ type: 'varchar', nullable: false })
  from: string;

  @Property({ type: ArrayType<string>, nullable: false })
  to: string[];

  @Property({ type: ArrayType<string>, nullable: true })
  cc?: string[];

  @Property({ type: ArrayType<string>, nullable: true })
  bcc?: string[];

  @Property({ type: 'text', nullable: false })
  subject: string;

  @Property({ type: 'text', nullable: false })
  body: string;

  @Property({ type: 'boolean', nullable: false })
  html = false;

  @Property({ type: 'boolean', nullable: false })
  verifiedSend = false;

  @Property({ type: 'boolean', nullable: false })
  verifiedReject = false;

  @Property({ type: 'boolean', nullable: false })
  verifiedDelivery = false;

  @Property({ type: 'boolean', nullable: false })
  verifiedBounce = false;

  @Property({ type: 'boolean', nullable: false })
  verifiedComplaint = false;

  @Property({ type: 'boolean', nullable: false })
  verifiedClick = false;

  @Property({ type: 'boolean', nullable: false })
  verifiedOpen = false;

  @Property({ type: 'json', nullable: true })
  payload: null | object = null;
}
