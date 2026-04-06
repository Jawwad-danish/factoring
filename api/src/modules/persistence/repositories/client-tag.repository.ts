import { ClientTagEntity } from '@module-persistence/entities';
import { BasicRepository } from '@module-persistence/repositories';
import { DatabaseService } from '@module-database';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class ClientTagRepository extends BasicRepository<ClientTagEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientTagEntity);
  }

  async findByClientId(clientId: string): Promise<ClientTagEntity[]> {
    return this.repository.find({
      clientId: clientId,
    });
  }
}
