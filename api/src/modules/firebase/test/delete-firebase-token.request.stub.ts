import { RequestBuilderMixin } from '@core/test';
import { DeleteFirebaseTokenRequest } from '../data';

export class DeleteFirebaseTokenRequestBuilder extends RequestBuilderMixin<DeleteFirebaseTokenRequest>(
  () => {
    return new DeleteFirebaseTokenRequest();
  },
) {}
