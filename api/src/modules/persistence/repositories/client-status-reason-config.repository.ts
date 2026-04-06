import { EntityNotFoundError } from '@core/errors';
import { DatabaseService } from '@module-database';
import {
  ClientFactoringStatus,
  ClientStatusReason,
  ClientStatusReasonConfigEntity,
  RecordStatus,
} from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ClientStatusReasonConfigRepository extends BasicRepository<ClientStatusReasonConfigEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientStatusReasonConfigEntity);
  }

  async getOneByStatusAndReason(
    reason: ClientStatusReason,
    status: ClientFactoringStatus,
  ): Promise<ClientStatusReasonConfigEntity> {
    const reasonEntity = await this.repository.findOne({
      reason: reason,
      status: status,
      recordStatus: RecordStatus.Active,
    });
    if (!reasonEntity) {
      throw new EntityNotFoundError(
        `Could not find entity for reason ${reason} on status ${status}`,
      );
    }
    return reasonEntity;
  }
}
