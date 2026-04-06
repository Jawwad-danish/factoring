import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { PrimitiveEntity, RecordStatus } from './primitive.entity';

@Entity({ tableName: 'users' })
export class UserEntity extends PrimitiveEntity {
  @PrimaryKey({
    type: 'uuid',
    defaultRaw: 'uuid_generate_v4()',
  })
  id: string;

  @Property({
    nullable: true,
    unique: true,
    comment: 'External ID of the authentication service like Cognito or Auth0',
  })
  externalId: string | null;

  @Property({ nullable: false, unique: true })
  email: string;

  @Property({ nullable: true })
  firstName: null | string;

  @Property({ nullable: true })
  lastName: null | string;

  @Property({ name: 'fullName' })
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  @Index()
  @Property({
    type: 'timestamp',
    nullable: false,
    length: 3,
  })
  createdAt: Date = new Date();

  @ManyToOne({
    entity: () => UserEntity,
    nullable: true,
  })
  createdBy: UserEntity | null;

  @Enum({
    items: () => RecordStatus,
    default: RecordStatus.Active,
    nullable: false,
  })
  recordStatus: RecordStatus = RecordStatus.Active;

  @Property({
    type: 'timestamp',
    length: 3,
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  @ManyToOne({
    entity: () => UserEntity,
    nullable: true,
  })
  updatedBy: UserEntity | null;
}
