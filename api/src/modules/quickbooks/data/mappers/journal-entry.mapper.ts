import { DataMapperUtil } from '@common';
import { DataMapper } from '@core/mapping';
import {
  QuickbooksAccount,
  QuickbooksJournalEntry,
  QuickbooksJournalEntryLine,
} from '@fs-bobtail/factoring/data';
import { UserMapper } from '@module-common';
import { QuickbooksJournalEntryEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JournalEntryMapper
  implements DataMapper<QuickbooksJournalEntryEntity, QuickbooksJournalEntry>
{
  constructor(private readonly userMapper: UserMapper) {}

  async entityToModel(
    entity: QuickbooksJournalEntryEntity,
  ): Promise<QuickbooksJournalEntry> {
    return new QuickbooksJournalEntry({
      id: entity.id,
      type: entity.type,
      status: entity.status,
      docName: entity.docName,
      syncedAt: entity.syncedAt,
      businessDay: entity.businessDay,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedBy: await this.userMapper.updatedByToModel(entity),
      lines: await DataMapperUtil.asyncMapCollections(
        entity.lines,
        async (line) => {
          return new QuickbooksJournalEntryLine({
            id: line.id,
            type: line.type,
            amount: line.amount,
            account: new QuickbooksAccount({
              id: line.account.id,
              name: line.account.name || 'N/A',
            }),
          });
        },
      ),
    });
  }
}
