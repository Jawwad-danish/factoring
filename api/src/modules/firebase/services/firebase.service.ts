import { TokenMessage } from 'firebase-admin/messaging';

export interface FirebaseService {
  sendPushNotification(payload: TokenMessage): Promise<void>;
}
