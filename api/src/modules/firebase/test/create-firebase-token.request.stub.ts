import { RequestBuilderMixin } from '@core/test';
import { CreateFirebaseTokenRequest } from '../data';
import { randomString } from '@module-persistence';

export class CreateFirebaseTokenRequestBuilder extends RequestBuilderMixin<CreateFirebaseTokenRequest>(
  () => {
    return new CreateFirebaseTokenRequest();
  },
) {
  static createFirebaseTokenRequest() {
    return CreateFirebaseTokenRequestBuilder.from({
      firebaseDeviceToken: randomString(20),
    });
  }
}
