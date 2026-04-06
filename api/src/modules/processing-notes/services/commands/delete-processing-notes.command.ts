import { RequestCommand } from '@module-cqrs';
import { ProcessingNotesDeleteRequest } from '../../data';

export class DeleteProcessingNotesCommand extends RequestCommand<
  ProcessingNotesDeleteRequest,
  void
> {
  constructor(readonly id: string, request: ProcessingNotesDeleteRequest) {
    super(request);
  }
}
