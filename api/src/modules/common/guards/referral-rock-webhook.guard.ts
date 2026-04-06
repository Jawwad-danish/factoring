import { AppContextHolder, Authentication } from '@core/app-context';
import {
  REFERRAL_ROCK_CREDENTIALS,
  ReferralRockCredentials,
} from '../referral-rock';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class ReferralRockWebhookGuard implements CanActivate {
  constructor(
    @Inject(REFERRAL_ROCK_CREDENTIALS)
    private readonly credentials: ReferralRockCredentials,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const signatureHeader = req.get('rr-signature') ?? '';

    if (!signatureHeader) {
      throw new ForbiddenException('Missing RR-Signature header');
    }

    const eventType = (req.body as any)?.EventType as string | undefined;
    if (!eventType) {
      throw new ForbiddenException('Missing EventType in request body');
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      throw new ForbiddenException(
        'Missing raw body for signature verification',
      );
    }

    const key = this.getSigningKeyForEventType(eventType);
    const content = `${rawBody.toString('utf8')}.${eventType}`;
    const expectedSignature = crypto
      .createHmac('sha512', key)
      .update(content)
      .digest('base64');

    if (!this.safeEqual(expectedSignature, signatureHeader)) {
      throw new ForbiddenException('Invalid RR-Signature');
    }

    AppContextHolder.get().setAuthentication(Authentication.getSystem());
    return true;
  }

  private getSigningKeyForEventType(eventType: string): string {
    const key = this.credentials.webhookSigningKeysByEventType.get(
      eventType.toUpperCase(),
    );
    if (!key) {
      throw new ForbiddenException(
        `Missing Referral Rock signing key for event type: ${eventType}`,
      );
    }
    return key;
  }

  private safeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.byteLength !== bBuf.byteLength) {
      return false;
    }

    return crypto.timingSafeEqual(
      aBuf as unknown as Uint8Array,
      bBuf as unknown as Uint8Array,
    );
  }
}
