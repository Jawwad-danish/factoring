import { Command } from '@module-cqrs';

export class DeleteBrokerDocumentCommand extends Command<void> {
  constructor(readonly brokerId: string, readonly documentId: string) {
    super();
  }
}
