import { ClientsModule } from '@module-clients';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { ClientBrokerAssignmentController } from './controller';
import {
  NotPaidByBrokerValidator,
  ReleaseValidationService,
  ReleaseClientBrokerAssignmentHandler,
  ClientBrokerAssignmentService,
  FindClientBrokerAssignmentsQueryHandler,
  FindClientBrokerAssignmentQueryHandler,
  CreateClientBrokerAssignmentHandler,
  SendNoaHandler,
} from './services';
import { ClientBrokerAssignmentMapper } from './mappers';
import { CommonModule } from '@module-common';
import { BrokersModule } from '@module-brokers';
import { EmailModule } from '@module-email';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    PersistenceModule,
    CqrsModule,
    ClientsModule,
    BrokersModule,
    EmailModule,
  ],
  providers: [
    ClientBrokerAssignmentService,
    ReleaseValidationService,
    NotPaidByBrokerValidator,
    FindClientBrokerAssignmentsQueryHandler,
    FindClientBrokerAssignmentQueryHandler,
    SendNoaHandler,
    ClientBrokerAssignmentMapper,
    ReleaseClientBrokerAssignmentHandler,
    CreateClientBrokerAssignmentHandler,
  ],
  exports: [],
  controllers: [ClientBrokerAssignmentController],
})
export class ClientBrokerAssignmentsModule {}
