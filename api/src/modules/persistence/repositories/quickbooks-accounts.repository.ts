import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';
import { DatabaseService } from '@module-database';
import { QBAccountKeys, QuickbooksAccountEntity } from '../entities';

@Injectable()
export class QuickbooksAccountsRepository extends BasicRepository<QuickbooksAccountEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, QuickbooksAccountEntity);
  }

  async getByKeys(
    keys: QBAccountKeys[],
  ): Promise<Map<QBAccountKeys, QuickbooksAccountEntity>> {
    const accounts = await this.repository.find({ key: { $in: keys } });
    if (accounts.length !== keys.length) {
      throw new Error('Not all accounts found');
    }
    const map = new Map<QBAccountKeys, QuickbooksAccountEntity>();
    for (const account of accounts) {
      map.set(account.key, account);
    }
    return map;
  }
}
