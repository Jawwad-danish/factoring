import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { ClientFactoringRateReasonAssocEntity } from '../entities/client-factoring-rate-reason-assoc.entity';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ClientFactoringRateReasonAssocRepository extends BasicRepository<ClientFactoringRateReasonAssocEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientFactoringRateReasonAssocEntity);
  }
}
