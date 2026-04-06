import { CommonModule } from '@module-common';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { BrokersModule } from '../brokers';
import { ClientsModule } from '../clients';
import { ProcessingNotesController } from './controllers';
import { ProcessingNotesMapper } from './data';
import {
  CreateProcessingNotesCommandHandler,
  DeleteProcessingNotesCommandHandler,
  FindProcessingNotesQueryHandler,
  ProcessingNotesService,
  UpdateProcessingNotesCommandHandler,
} from './services';

const handlers = [
  CreateProcessingNotesCommandHandler,
  UpdateProcessingNotesCommandHandler,
  DeleteProcessingNotesCommandHandler,
  FindProcessingNotesQueryHandler,
];

@Module({
  imports: [
    DatabaseModule,
    PersistenceModule,
    CqrsModule,
    CommonModule,
    ClientsModule,
    BrokersModule,
  ],
  providers: [ProcessingNotesMapper, ProcessingNotesService, ...handlers],
  exports: [ProcessingNotesMapper],
  controllers: [ProcessingNotesController],
})
export class ProcessingNotesModule {}
