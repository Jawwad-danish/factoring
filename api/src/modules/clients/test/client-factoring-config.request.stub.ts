import { RequestBuilderMixin } from '@core/test';
import { UpdateClientFactoringConfigRequest } from '../data';

export class ClientFactoringConfigRequestBuilder extends RequestBuilderMixin<UpdateClientFactoringConfigRequest>(
  () => {
    return new UpdateClientFactoringConfigRequest();
  },
) {}
