import { User } from '@core/data';
import { DataMapper } from '@core/mapping';
import {
  BasicEntity,
  BasicMutableEntity,
  UserEntity,
} from '@module-persistence';
import { Injectable } from '@nestjs/common';
@Injectable()
export class UserMapper implements DataMapper<UserEntity, User> {
  async createdByToModel<E extends BasicEntity>(
    entity: E,
  ): Promise<null | User> {
    if (entity.createdBy) {
      return this.entityToModel(entity.createdBy);
    }
    return null;
  }

  async updatedByToModel<E extends BasicMutableEntity>(
    entity: E,
  ): Promise<null | User> {
    if (entity.updatedBy) {
      return this.entityToModel(entity.updatedBy);
    }
    return null;
  }

  async entityToModel(entity: UserEntity): Promise<User> {
    return new User({
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      externalId: entity.externalId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
