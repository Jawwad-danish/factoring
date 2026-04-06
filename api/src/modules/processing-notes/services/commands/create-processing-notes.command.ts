import { RequestCommand } from '@module-cqrs';
import { ProcessingNotesEntity } from '@module-persistence/entities';
import { ProcessingNotesCreateRequest } from '../../data';

export class CreateProcessingNotesCommand extends RequestCommand<
  ProcessingNotesCreateRequest,
  ProcessingNotesEntity
> {
  constructor(request: ProcessingNotesCreateRequest) {
    super(request);
  }
}
