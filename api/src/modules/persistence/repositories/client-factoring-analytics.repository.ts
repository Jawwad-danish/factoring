import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { ClientFactoringAnalyticsEntity } from '../entities';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ClientFactoringAnalyticsRepository extends BasicRepository<ClientFactoringAnalyticsEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientFactoringAnalyticsEntity);
  }

  findByClientId(clientId: string) {
    return this.repository.findOne({
      clientId,
    });
  }
}
