import { RequestCommand } from '@module-cqrs';
import { BrokerDocument } from '../../data/model';
import { BrokerDocumentRequest } from '../../data/web';

export class CreateBrokerDocumentCommand extends RequestCommand<
  BrokerDocumentRequest,
  BrokerDocument
> {
  constructor(readonly brokerId: string, request: BrokerDocumentRequest) {
    super(request);
  }
}
