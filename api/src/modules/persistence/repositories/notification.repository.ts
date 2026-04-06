import { Inject, Injectable } from '@nestjs/common';
import { NotificationEntity } from '../entities';

import { DatabaseService } from '@module-database';
import { BasicRepository } from './basic-repository';

@Injectable()
export class NotificationRepository extends BasicRepository<NotificationEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, NotificationEntity);
  }
}
