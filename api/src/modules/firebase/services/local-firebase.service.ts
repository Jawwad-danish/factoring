import { Injectable } from '@nestjs/common';
import { TokenMessage } from 'firebase-admin/messaging';
import { FirebaseService } from './firebase.service';

@Injectable()
export class LocalFirebaseService implements FirebaseService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendPushNotification(_payload: TokenMessage): Promise<void> {
    return;
  }
}
