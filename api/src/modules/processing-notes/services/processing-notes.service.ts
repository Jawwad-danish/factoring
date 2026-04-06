import { QueryCriteria } from '@core/data';
import { CommandRunner, QueryRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import { ProcessingNotesEntity } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import {
  ProcessingNotesCreateRequest,
  ProcessingNotesDeleteRequest,
  ProcessingNotesUpdateRequest,
} from '../data';
import {
  CreateProcessingNotesCommand,
  DeleteProcessingNotesCommand,
  UpdateProcessingNotesCommand,
} from './commands';
import {
  FindProcessingNotesQuery,
  FindProcessingNotesQueryResult,
} from './queries';

@Injectable()
export class ProcessingNotesService {
  constructor(
    private readonly commandRunner: CommandRunner,
    private readonly queryRunner: QueryRunner,
  ) {}

  @Transactional('processing-notes.create')
  create(
    payload: ProcessingNotesCreateRequest,
  ): Promise<ProcessingNotesEntity> {
    return this.commandRunner.run(new CreateProcessingNotesCommand(payload));
  }

  @Transactional('processing-notes.update')
  update(
    id: string,
    payload: ProcessingNotesUpdateRequest,
  ): Promise<ProcessingNotesEntity> {
    return this.commandRunner.run(
      new UpdateProcessingNotesCommand(id, payload),
    );
  }

  @Transactional('processing-notes.delete')
  delete(id: string, payload: ProcessingNotesDeleteRequest): Promise<void> {
    return this.commandRunner.run(
      new DeleteProcessingNotesCommand(id, payload),
    );
  }

  async findAll(
    criteria: QueryCriteria,
  ): Promise<FindProcessingNotesQueryResult> {
    return this.queryRunner.run(new FindProcessingNotesQuery(criteria));
  }
}
