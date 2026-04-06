import { AWSModule } from '@module-aws';
import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { FirebaseTokenController } from './controllers';
import {
  FIREBASE_SERVICE,
  FirebaseCredentialsService,
  FirebaseServiceProvider,
  FirebaseTokenService,
} from './services';
import {
  CreateFirebaseTokenCommandHandler,
  DeleteAllFirebaseTokensCommandHandler,
  DeleteFirebaseTokenCommandHandler,
} from './services/commands';
import { FirebaseTokenMapper } from './data';

@Module({
  imports: [PersistenceModule, CqrsModule, AWSModule, BobtailConfigModule],
  controllers: [FirebaseTokenController],
  providers: [
    FirebaseTokenService,
    FirebaseCredentialsService,
    CreateFirebaseTokenCommandHandler,
    DeleteFirebaseTokenCommandHandler,
    DeleteAllFirebaseTokensCommandHandler,
    FirebaseServiceProvider,
    FirebaseTokenMapper,
  ],
  exports: [
    FirebaseTokenService,
    FirebaseServiceProvider,
    FirebaseCredentialsService,
    FIREBASE_SERVICE,
  ],
})
export class FirebaseModule {}
