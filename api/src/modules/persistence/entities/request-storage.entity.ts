import { Entity, Enum, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { JSONObject } from '../../../core/types';
import { PrimitiveEntity } from './primitive.entity';

export enum RequestMethod {
  Get = 'GET',
  Post = 'POST',
  Patch = 'PATCH',
  Put = 'PUT',
  Delete = 'DELETE',
}

@Entity({ tableName: 'request_storage' })
export class RequestStorageEntity extends PrimitiveEntity {
  @PrimaryKey()
  id: number;

  @Index()
  @Property({
    type: 'timestamp',
    nullable: false,
    length: 3,
  })
  createdAt: Date = new Date();

  @Property({ type: 'string', nullable: false, unique: false })
  route: string;

  @Enum({
    items: () => RequestMethod,
    nullable: false,
  })
  method: RequestMethod;

  @Property({ type: 'json', nullable: false, unique: false })
  payload: JSONObject;

  @Property({ type: 'uuid', default: null, nullable: true })
  createdBy: null | string;

  @Property({ type: 'uuid', default: null, nullable: true })
  correlationId: null | string;
}
