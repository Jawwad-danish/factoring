import { RequestCommand } from '@module-cqrs';
import { BrokerDocument } from '../../data/model';
import { BrokerDocumentRequest } from '../../data/web';

export class UpdateBrokerDocumentCommand extends RequestCommand<
  BrokerDocumentRequest,
  BrokerDocument
> {
  constructor(
    readonly brokerId: string,
    readonly documentId: string,
    request: BrokerDocumentRequest,
  ) {
    super(request);
  }
}
