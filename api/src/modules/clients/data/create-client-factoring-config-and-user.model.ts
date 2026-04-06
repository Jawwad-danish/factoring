import { ClientFactoringConfigsEntity, UserEntity } from '@module-persistence';

export interface ClientConfigUser {
  clientConfig: ClientFactoringConfigsEntity;
  user: UserEntity;
}
