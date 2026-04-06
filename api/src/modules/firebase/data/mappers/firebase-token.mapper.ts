import { FirebaseTokenEntity, UserEntity } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { DataMapper } from '../../../../core';
import { CreateFirebaseTokenRequest } from '../web';

@Injectable()
export class FirebaseTokenMapper implements DataMapper<void, void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entityToModel(_entity: void): Promise<void> {
    throw new Error('Method not implemented.');
  }

  createRequestToEntity(
    request: CreateFirebaseTokenRequest,
    user: UserEntity,
  ): FirebaseTokenEntity {
    const entity = new FirebaseTokenEntity();
    entity.token = request.firebaseDeviceToken;
    entity.user = user;
    return entity;
  }
}
