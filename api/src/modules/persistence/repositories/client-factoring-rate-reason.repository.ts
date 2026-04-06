import { EntityNotFoundError } from '@core/errors';
import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import {
  ClientFactoringRateReason,
  ClientFactoringRateReasonEntity,
} from '../entities/client-factoring-rate-reason.entity';
import { RecordStatus } from '../entities/primitive.entity';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ClientFactoringRateReasonRepository extends BasicRepository<ClientFactoringRateReasonEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientFactoringRateReasonEntity);
  }

  async getOneByReason(
    reason: ClientFactoringRateReason,
  ): Promise<ClientFactoringRateReasonEntity> {
    const reasonEntity = await this.repository.findOne({
      reason: reason,
      recordStatus: RecordStatus.Active,
    });
    if (!reasonEntity) {
      throw new EntityNotFoundError(
        `Could not find ${ClientFactoringRateReasonEntity.name} entity for reason ${reason}`,
      );
    }
    return reasonEntity;
  }
}
