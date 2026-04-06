import { Injectable, Logger } from '@nestjs/common';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { getMessaging, TokenMessage } from 'firebase-admin/messaging';
import { FirebaseCredentials } from './firebase-credentials.service';

@Injectable()
export class CloudFirebaseService {
  private readonly logger: Logger = new Logger(CloudFirebaseService.name);
  private app: App;

  constructor(private readonly creds: FirebaseCredentials) {
    this.app = initializeApp({
      credential: cert({
        projectId: this.creds.projectId,
        clientEmail: this.creds.clientEmail,
        privateKey: this.creds.privateKey?.replace(/\\n/g, '\n'),
      }),
    });
  }

  async sendPushNotification(payload: TokenMessage): Promise<void> {
    try {
      const response = await getMessaging(this.app).send(payload);
      this.logger.debug(
        `Sent push notification to token[${
          payload.token
        }] message: ${JSON.stringify(payload)} response: ${response} `,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to token[${payload.token}], ${error}`,
      );
    }
  }
}
