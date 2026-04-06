import { RequestBuilderMixin } from '@core/test';
import { UpdateClientFactoringConfigRequest } from '../data/web';

export class UpdateClientFactoringConfigRequestBuilder extends RequestBuilderMixin<UpdateClientFactoringConfigRequest>(
  () => {
    return new UpdateClientFactoringConfigRequest();
  },
) {}
