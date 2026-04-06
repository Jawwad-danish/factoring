import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { FirebaseTokenEntity, RecordStatus } from '../entities';
import { BasicRepository } from './basic-repository';

@Injectable()
export class FirebaseTokenRepository extends BasicRepository<FirebaseTokenEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, FirebaseTokenEntity);
  }

  async findOneByToken(
    token: string,
    userId: string,
  ): Promise<FirebaseTokenEntity | null> {
    return await this.repository.findOne({
      token,
      user: {
        id: userId,
      },
    });
  }

  async findTokensByUserId(userId: string): Promise<FirebaseTokenEntity[]> {
    return await this.repository.find({
      user: {
        id: userId,
      },
      recordStatus: RecordStatus.Active,
    });
  }
}
