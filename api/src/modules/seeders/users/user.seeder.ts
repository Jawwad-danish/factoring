import { UserRepository } from '@module-persistence';
import { UserEntity } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserSeeder {
  private logger: Logger = new Logger(UserSeeder.name);

  constructor(private readonly repository: UserRepository) {}

  async create(data?: Partial<UserEntity>): Promise<UserEntity> {
    try {
      const user = EntityStubs.buildUser(data);
      await this.repository.upsertAndFlush(user);
      return user;
    } catch (error) {
      this.logger.error(`Could not seed user`, error);
      throw error;
    }
  }
}
