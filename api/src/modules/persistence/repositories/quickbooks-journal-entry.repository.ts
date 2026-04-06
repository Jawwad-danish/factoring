import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { QuickbooksJournalEntryEntity } from '../entities';
import { BasicRepository } from './basic-repository';
import { FilterQuery, FindOneOptions } from '@mikro-orm/core';

@Injectable()
export class QuickbooksJournalEntryRepository extends BasicRepository<QuickbooksJournalEntryEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, QuickbooksJournalEntryEntity);
  }

  async findOne(
    where: FilterQuery<QuickbooksJournalEntryEntity>,
    options?: FindOneOptions<QuickbooksJournalEntryEntity>,
  ): Promise<QuickbooksJournalEntryEntity | null> {
    return this.repository.findOne(where, options);
  }
}
