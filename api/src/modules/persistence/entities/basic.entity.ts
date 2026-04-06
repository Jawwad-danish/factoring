import {
  Enum,
  Index,
  LoadStrategy,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { PrimitiveEntity, RecordStatus } from './primitive.entity';
import { UserEntity } from './user.entity';

export class BasicEntitySchema {
  static COLUMN_ID = 'id';
  static COLUMN_CREATED_AT = 'created_at';
  static COLUMN_CREATED_BY = 'created_by_id';
  static COLUMN_RECORD_STATUS = 'record_status';
}

export class BasicEntity extends PrimitiveEntity {
  @PrimaryKey({
    fieldName: BasicEntitySchema.COLUMN_ID,
    type: 'uuid',
    defaultRaw: 'uuid_generate_v4()',
  })
  id: string;

  @Index()
  @Property({
    fieldName: BasicEntitySchema.COLUMN_CREATED_AT,
    type: 'timestamp',
    nullable: false,
    length: 3,
  })
  createdAt: Date = new Date();

  @ManyToOne({
    fieldName: BasicEntitySchema.COLUMN_CREATED_BY,
    entity: () => UserEntity,
    lazy: true,
    strategy: LoadStrategy.JOINED,
  })
  createdBy?: UserEntity;

  @Enum({
    fieldName: BasicEntitySchema.COLUMN_RECORD_STATUS,
    items: () => RecordStatus,
    default: RecordStatus.Active,
    nullable: false,
  })
  recordStatus: RecordStatus = RecordStatus.Active;
}
