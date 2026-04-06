import { DatabaseService } from '@module-database';
import { EmailEntity } from '@module-persistence/entities';
import { BasicRepository } from '@module-persistence/repositories';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class EmailRepository extends BasicRepository<EmailEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, EmailEntity);
  }
}
