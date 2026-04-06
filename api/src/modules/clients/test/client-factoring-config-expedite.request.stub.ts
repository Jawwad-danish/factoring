import { RequestBuilderMixin } from '@core/test';
import { UpdateClientFactoringConfigExpediteRequest } from '../data';

export class ClientFactoringConfigExpediteRequestBuilder extends RequestBuilderMixin<UpdateClientFactoringConfigExpediteRequest>(
  () => {
    return new UpdateClientFactoringConfigExpediteRequest();
  },
) {}
