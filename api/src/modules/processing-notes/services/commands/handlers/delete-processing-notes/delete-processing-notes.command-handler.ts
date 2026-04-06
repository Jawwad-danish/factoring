import {
  ProcessingNotesEntity,
  ProcessingNotesRepository,
  RecordStatus,
} from '@module-persistence';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteProcessingNotesCommand } from '../../delete-processing-notes.command';

@CommandHandler(DeleteProcessingNotesCommand)
export class DeleteProcessingNotesCommandHandler
  implements
    ICommandHandler<DeleteProcessingNotesCommand, ProcessingNotesEntity>
{
  constructor(private readonly repository: ProcessingNotesRepository) {}

  async execute({
    id,
  }: DeleteProcessingNotesCommand): Promise<ProcessingNotesEntity> {
    const entity = await this.repository.getOneById(id);
    entity.recordStatus = RecordStatus.Inactive;
    return entity;
  }
}
