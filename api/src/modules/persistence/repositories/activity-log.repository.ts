import { DatabaseService } from '@module-database';
import {
  ActivityLogEntity,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { BasicRepository } from './basic-repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ActivityLogRepository extends BasicRepository<ActivityLogEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ActivityLogEntity);
  }

  async getOneByTagDefinitionKey(
    key: TagDefinitionKey,
    invoiceId: string,
  ): Promise<ActivityLogEntity | null> {
    return await this.repository.findOne(
      { tagDefinition: { key: key }, invoice: { id: invoiceId } },
      {
        populate: ['tagDefinition', 'invoice'],
      },
    );
  }
}
