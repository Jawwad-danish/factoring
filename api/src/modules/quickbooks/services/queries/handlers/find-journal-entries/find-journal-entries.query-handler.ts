import { FindOptions, LoadStrategy, ObjectQuery } from '@mikro-orm/core';
import {
  QuickbooksJournalEntryEntity,
  RecordStatus,
} from '@module-persistence/entities';
import {
  mapToFindOptions,
  QuickbooksJournalEntryRepository,
} from '@module-persistence/repositories';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindJournalEntriesFilterCriteria } from '../../../../data';
import {
  FindJournalEntriesQuery,
  FindJournalEntriesQueryResult,
} from '../../find-journal-entries.query';

@QueryHandler(FindJournalEntriesQuery)
export class FindJournalEntriesQueryHandler
  implements
    IQueryHandler<FindJournalEntriesQuery, FindJournalEntriesQueryResult>
{
  constructor(
    private journalEntryRepository: QuickbooksJournalEntryRepository,
  ) {}

  async execute(
    query: FindJournalEntriesQuery,
  ): Promise<FindJournalEntriesQueryResult> {
    const filter = query.criteria.mapFiltersToClass(
      FindJournalEntriesFilterCriteria,
    );
    const whereClause: ObjectQuery<QuickbooksJournalEntryEntity> = {
      recordStatus: RecordStatus.Active,
    };

    this.applyBusinessDayFilter(filter, whereClause);
    this.applyTypeFilter(filter, whereClause);
    this.applyStatusFilter(filter, whereClause);

    const defaultFindOptions: FindOptions<QuickbooksJournalEntryEntity, any> = {
      populate: ['lines', 'lines.account'],
      orderBy: { createdAt: 'DESC' },
      strategy: LoadStrategy.SELECT_IN,
    };

    const findOptions: FindOptions<QuickbooksJournalEntryEntity, any> = {
      ...defaultFindOptions,
      ...mapToFindOptions<QuickbooksJournalEntryEntity>(query.criteria),
    };

    const [entities, count] = await this.journalEntryRepository.findAll(
      whereClause,
      findOptions,
    );

    return {
      entities,
      count,
    };
  }

  private applyBusinessDayFilter(
    filter: FindJournalEntriesFilterCriteria,
    whereClause: ObjectQuery<QuickbooksJournalEntryEntity>,
  ) {
    if (filter.businessDay) {
      whereClause.businessDay = {
        [filter.businessDay.operator]: filter.businessDay.value,
      };
    }
  }

  private applyTypeFilter(
    filter: FindJournalEntriesFilterCriteria,
    whereClause: ObjectQuery<QuickbooksJournalEntryEntity>,
  ) {
    if (filter.type) {
      whereClause.type = {
        [filter.type.operator]: filter.type.value,
      };
    }
  }

  private applyStatusFilter(
    filter: FindJournalEntriesFilterCriteria,
    whereClause: ObjectQuery<QuickbooksJournalEntryEntity>,
  ) {
    if (filter.status) {
      whereClause.status = {
        [filter.status.operator]: filter.status.value,
      };
    }
  }
}
