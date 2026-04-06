import { WorkerJobEntity } from '../entities/worker-job.entity';
import { BasicRepository } from './basic-repository';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '@module-database';
@Injectable()
export class WorkerJobRepository extends BasicRepository<WorkerJobEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, WorkerJobEntity);
  }
}
