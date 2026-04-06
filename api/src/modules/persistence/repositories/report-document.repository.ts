import { Inject, Injectable } from '@nestjs/common';
import { ReportDocumentEntity } from '../entities/report-document.entity';
import { BasicRepository } from './basic-repository';
import { DatabaseService } from '@module-database';

@Injectable()
export class ReportDocumentRepository extends BasicRepository<ReportDocumentEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ReportDocumentEntity);
  }
}
