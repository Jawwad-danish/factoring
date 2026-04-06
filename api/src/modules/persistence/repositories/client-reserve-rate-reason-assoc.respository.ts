import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { ClientReserveRateReasonAssocEntity } from '../entities/client-reserve-rate-reason-assoc.entity';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ClientReseveRateReasonAssocRepository extends BasicRepository<ClientReserveRateReasonAssocEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientReserveRateReasonAssocEntity);
  }
}
