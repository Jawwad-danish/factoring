import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';
import { AssignmentsChangelogAssocEntity } from '@module-persistence/entities';
import { DatabaseService } from '@module-database';

@Injectable()
export class AssignmentsChangelogAssocRepository extends BasicRepository<AssignmentsChangelogAssocEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, AssignmentsChangelogAssocEntity);
  }
}
