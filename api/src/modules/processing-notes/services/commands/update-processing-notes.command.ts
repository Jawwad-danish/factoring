import { RequestCommand } from '@module-cqrs';
import { ProcessingNotesEntity } from '@module-persistence/entities';
import { ProcessingNotesUpdateRequest } from '../../data';

export class UpdateProcessingNotesCommand extends RequestCommand<
  ProcessingNotesUpdateRequest,
  ProcessingNotesEntity
> {
  constructor(readonly id: string, request: ProcessingNotesUpdateRequest) {
    super(request);
  }
}
