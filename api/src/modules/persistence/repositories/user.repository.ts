import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../entities';
import { BasicRepository } from './basic-repository';

@Injectable()
export class UserRepository extends BasicRepository<UserEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, UserEntity);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({
      email,
    });
  }
}
