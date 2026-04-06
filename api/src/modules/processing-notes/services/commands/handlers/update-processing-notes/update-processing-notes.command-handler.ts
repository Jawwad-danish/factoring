import {
  ProcessingNotesEntity,
  ProcessingNotesRepository,
  ProcessingNotesStatus,
} from '@module-persistence';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateProcessingNotesCommand } from '../../update-processing-notes.command';

@CommandHandler(UpdateProcessingNotesCommand)
export class UpdateProcessingNotesCommandHandler
  implements
    ICommandHandler<UpdateProcessingNotesCommand, ProcessingNotesEntity>
{
  private readonly logger = new Logger(
    UpdateProcessingNotesCommandHandler.name,
  );

  constructor(private readonly repository: ProcessingNotesRepository) {}

  async execute({
    id,
    request,
  }: UpdateProcessingNotesCommand): Promise<ProcessingNotesEntity> {
    const entity = await this.repository.getOneById(id);
    if (request.brokerId) {
      entity.brokerId = request.brokerId;
    }

    if (request.clientId) {
      entity.clientId = request.clientId;
    }

    if (request.notes) {
      entity.notes = request.notes;
    }

    if (request.status) {
      // Only one active specific note at a time
      if (
        request.status === ProcessingNotesStatus.Active &&
        entity.status !== ProcessingNotesStatus.Active &&
        entity.clientId &&
        entity.brokerId
      ) {
        await this.archiveAllOtherSpecificNotes(
          entity.clientId,
          entity.brokerId,
        );
      }

      entity.status = request.status;
    }
    return entity;
  }

  private async archiveAllOtherSpecificNotes(
    clientId: string,
    brokerId: string,
  ) {
    const notes = await this.repository.find({
      clientId,
      brokerId,
    });
    notes.forEach((note) => (note.status = ProcessingNotesStatus.Archived));
    this.logger.debug(
      `Archived ${notes.length} specific notes for client ${clientId} and broker ${brokerId}`,
    );
  }
}
