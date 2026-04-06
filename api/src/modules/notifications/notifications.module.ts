import { AuthModule } from '@module-auth';
import { AWSModule } from '@module-aws';
import { ClientApi } from '@module-clients';
import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { EmailModule } from '@module-email';
import { FirebaseModule } from '@module-firebase';
import { PersistenceModule } from '@module-persistence';
import { SmsModule } from '@module-sms';
import { Module } from '@nestjs/common';
import {
  CreateEmailNotificationCommandHandler,
  NotifyClientCommandHandler,
} from './commands';
import {
  BrokerRatingChangedEventHandler,
  NotificationsService,
} from './services';

@Module({
  providers: [
    NotificationsService,
    NotifyClientCommandHandler,
    CreateEmailNotificationCommandHandler,
    BrokerRatingChangedEventHandler,
    ClientApi,
  ],
  exports: [NotificationsService],
  imports: [
    AuthModule,
    AWSModule,
    BobtailConfigModule,
    CommonModule,
    DatabaseModule,
    SmsModule,
    EmailModule,
    CqrsModule,
    PersistenceModule,
    FirebaseModule,
  ],
  controllers: [],
})
export class NotificationsModule {}
