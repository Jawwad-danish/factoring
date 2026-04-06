import {
  ProcessingNotesEntity,
  ProcessingNotesRepository,
  ProcessingNotesStatus,
  RecordStatus,
} from '@module-persistence';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProcessingNotesCommand } from '../../create-processing-notes.command';
import { ProcessingNotesMapper } from '../../../../data';
import { Logger } from '@nestjs/common';

@CommandHandler(CreateProcessingNotesCommand)
export class CreateProcessingNotesCommandHandler
  implements
    ICommandHandler<CreateProcessingNotesCommand, ProcessingNotesEntity>
{
  private readonly logger = new Logger(
    CreateProcessingNotesCommandHandler.name,
  );

  constructor(
    private readonly mapper: ProcessingNotesMapper,
    private readonly repository: ProcessingNotesRepository,
  ) {}

  async execute({
    request,
  }: CreateProcessingNotesCommand): Promise<ProcessingNotesEntity> {
    const entity = await this.mapper.createRequestToEntity(request);

    // Only one active specific note per client and broker
    if (entity.clientId && entity.brokerId) {
      await this.archiveAllOtherSpecificNotes(entity.clientId, entity.brokerId);
    }

    // Only one general note per client
    if (entity.clientId && !entity.brokerId) {
      await this.deleteClientGeneralNotes(entity.clientId);
    }

    this.repository.persist(entity);
    return entity;
  }

  private async deleteClientGeneralNotes(clientId: string) {
    const notes = await this.repository.find({
      clientId,
      brokerId: { $eq: null },
    });
    notes.forEach((note) => (note.recordStatus = RecordStatus.Inactive));
    this.logger.debug(
      `Deleted ${notes.length} general notes for client ${clientId}`,
    );
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
