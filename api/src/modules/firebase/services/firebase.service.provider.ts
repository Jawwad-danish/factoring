import { environment } from '@core/environment';
import { Provider } from '@nestjs/common';
import { CloudFirebaseService } from './cloud-firebase.service';
import { FirebaseCredentialsService } from './firebase-credentials.service';
import { LocalFirebaseService } from './local-firebase.service';

export const FIREBASE_SERVICE = 'FirebaseService';

export const FirebaseServiceProvider: Provider = {
  provide: FIREBASE_SERVICE,
  useFactory: async (credentialsService: FirebaseCredentialsService) => {
    if (environment.isLocal() || environment.isTest()) {
      return new LocalFirebaseService();
    }

    const creds = await credentialsService.getCredentials();
    return new CloudFirebaseService(creds);
  },
  inject: [FirebaseCredentialsService],
};
