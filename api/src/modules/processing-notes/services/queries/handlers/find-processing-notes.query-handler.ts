import { ObjectQuery } from '@mikro-orm/core';
import {
  InvoiceRepository,
  ProcessingNotesEntity,
  ProcessingNotesRepository,
} from '@module-persistence';
import { RecordStatus } from '@module-persistence/entities';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindProcessingNotesFilterCriteria } from '../../../data';
import {
  FindProcessingNotesQuery,
  FindProcessingNotesQueryResult,
} from '../find-processing-notes.query';

@QueryHandler(FindProcessingNotesQuery)
export class FindProcessingNotesQueryHandler
  implements
    IQueryHandler<FindProcessingNotesQuery, FindProcessingNotesQueryResult>
{
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly processingNotesRepository: ProcessingNotesRepository,
  ) {}

  async execute(
    query: FindProcessingNotesQuery,
  ): Promise<FindProcessingNotesQueryResult> {
    const [entities, count] =
      await this.processingNotesRepository.findByQueryCriteria(query.criteria, {
        additionalWhereClause: {
          recordStatus: RecordStatus.Active,
        },
        knownFilterCriteriaOptions: {
          constructor: FindProcessingNotesFilterCriteria,
          whereClauseGenerator: (input) => this.generateWhereClause(input),
        },
        populate: ['createdBy'],
      });

    return { entities, count };
  }

  async generateWhereClause(
    criteria: FindProcessingNotesFilterCriteria,
  ): Promise<ObjectQuery<ProcessingNotesEntity>> {
    const whereClause: ObjectQuery<ProcessingNotesEntity> = {};
    if (criteria.invoiceId?.value) {
      const invoice = await this.invoiceRepository.getOneById(
        criteria.invoiceId.value,
      );
      // We always want client general notes
      whereClause['$or'] = [{ clientId: invoice.clientId, brokerId: null }];

      // If broker is present, we also want broker general notes and client-broker notes
      if (invoice.brokerId) {
        whereClause['$or'].push({
          brokerId: invoice.brokerId,
          clientId: null,
        });
        whereClause['$or'].push({
          brokerId: invoice.brokerId,
          clientId: invoice.clientId,
        });
      }
    }
    return whereClause;
  }
}
