import { Injectable, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { SecretsSupplier } from '../secrets';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly algorithm = 'aes-256-gcm';
  private secretKey: Buffer;
  private readonly ivLength = 12;

  constructor(private readonly secretsSupplier: SecretsSupplier) {}

  async onModuleInit() {
    const secret = await this.secretsSupplier.get('ENCRYPTION_SECRET_ARN');
    const secretString = secret.secret as string;
    this.secretKey = Buffer.from(secretString, 'base64');

    if (this.secretKey.length !== 32) {
      throw new Error(
        `Encryption key must be 32 bytes (256 bits), got ${this.secretKey.length} bytes`,
      );
    }
  }

  encrypt(text: string): string {
    if (!text) {
      throw new Error('Cannot encrypt empty text');
    }

    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(
      this.algorithm,
      this.secretKey as any,
      iv as any,
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(text: string): string {
    if (!text) {
      throw new Error('Cannot decrypt empty text');
    }

    const parts = text.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(
      this.algorithm,
      this.secretKey as any,
      iv as any,
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
