import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { AuditLogEntity } from '../entities';
import { BasicRepository } from './basic-repository';

@Injectable()
export class AuditLogRepository extends BasicRepository<AuditLogEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, AuditLogEntity);
  }
}
