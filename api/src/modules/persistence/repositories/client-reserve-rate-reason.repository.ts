import { EntityNotFoundError } from '@core/errors';
import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import {
  ClientReserveRateReason,
  ClientReserveRateReasonEntity,
} from '../entities/client-reserve-rate-reason.entity';
import { RecordStatus } from '../entities/primitive.entity';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ClientReserveRateReasonRepository extends BasicRepository<ClientReserveRateReasonEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientReserveRateReasonEntity);
  }

  async getOneByReason(
    reason: ClientReserveRateReason,
  ): Promise<ClientReserveRateReasonEntity> {
    const reasonEntity = await this.repository.findOne({
      reason: reason,
      recordStatus: RecordStatus.Active,
    });
    if (!reasonEntity) {
      throw new EntityNotFoundError(
        `Could not find ${ClientReserveRateReasonEntity.name} entity for reason ${reason}`,
      );
    }
    return reasonEntity;
  }
}
