import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { ProcessingNotesEntity } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { ProcessingNotes } from '../processing-notes.model';
import { ProcessingNotesCreateRequest } from '../web';

@Injectable()
export class ProcessingNotesMapper
  implements DataMapper<ProcessingNotesEntity, ProcessingNotes>
{
  constructor(private readonly userMapper: UserMapper) {}

  async createRequestToEntity(
    request: ProcessingNotesCreateRequest,
  ): Promise<ProcessingNotesEntity> {
    const entity = new ProcessingNotesEntity();
    entity.brokerId = request.brokerId;
    entity.clientId = request.clientId;
    entity.notes = request.notes;
    return entity;
  }

  async entityToModel(entity: ProcessingNotesEntity): Promise<ProcessingNotes> {
    const model = new ProcessingNotes({
      id: entity.id,
      clientId: entity.clientId,
      brokerId: entity.brokerId,
      notes: entity.notes,
      status: entity.status,
      createdAt: entity.createdAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedAt: entity.updatedAt,
      updatedBy: await this.userMapper.updatedByToModel(entity),
    });
    return model;
  }
}
