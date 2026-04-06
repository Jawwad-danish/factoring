import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { AuditLogController } from './controllers';
import { AuditLogMapper } from './data';
import { AuditLogService, FindAuditLogsQueryHandler } from './services';

@Module({
  imports: [DatabaseModule, PersistenceModule, CqrsModule],
  providers: [AuditLogMapper, AuditLogService, FindAuditLogsQueryHandler],
  controllers: [AuditLogController],
  exports: [],
})
export class AuditLogModule {}
