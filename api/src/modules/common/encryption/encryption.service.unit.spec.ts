import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SecretsSupplier } from '../secrets';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const secretsSupplier = createMock<SecretsSupplier>();

  const validSecretKey = Buffer.from('a'.repeat(32)).toString('base64');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: SecretsSupplier,
          useValue: secretsSupplier,
        },
      ],
    }).compile();

    encryptionService = module.get<EncryptionService>(EncryptionService);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize with valid 32-byte secret key', async () => {
      jest.spyOn(secretsSupplier, 'get').mockResolvedValue({
        secret: validSecretKey,
      });

      await encryptionService.onModuleInit();

      expect(secretsSupplier.get).toHaveBeenCalledWith('ENCRYPTION_SECRET_ARN');
    });

    it('should throw error when secret key is not 32 bytes', async () => {
      const invalidKey = Buffer.from('short').toString('base64');
      jest.spyOn(secretsSupplier, 'get').mockResolvedValue({
        secret: invalidKey,
      });

      await expect(encryptionService.onModuleInit()).rejects.toThrow(
        /Encryption key must be 32 bytes/,
      );
    });

    it('should throw error when secret key is longer than 32 bytes', async () => {
      const invalidKey = Buffer.from('a'.repeat(64)).toString('base64');
      jest.spyOn(secretsSupplier, 'get').mockResolvedValue({
        secret: invalidKey,
      });

      await expect(encryptionService.onModuleInit()).rejects.toThrow(
        /Encryption key must be 32 bytes/,
      );
    });
  });

  describe('encrypt', () => {
    beforeEach(async () => {
      jest.spyOn(secretsSupplier, 'get').mockResolvedValue({
        secret: validSecretKey,
      });
      await encryptionService.onModuleInit();
    });

    it('should encrypt text successfully', () => {
      const plainText = 'sensitive data';

      const encrypted = encryptionService.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should produce different ciphertext for same plaintext due to random IV', () => {
      const plainText = 'sensitive data';

      const encrypted1 = encryptionService.encrypt(plainText);
      const encrypted2 = encryptionService.encrypt(plainText);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error when encrypting empty text', () => {
      expect(() => encryptionService.encrypt('')).toThrow(
        'Cannot encrypt empty text',
      );
    });

    it('should encrypt special characters correctly', () => {
      const plainText = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = encryptionService.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should encrypt unicode characters correctly', () => {
      const plainText = '你好世界 🚀 مرحبا';

      const encrypted = encryptionService.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should encrypt long text correctly', () => {
      const plainText = 'a'.repeat(10000);

      const encrypted = encryptionService.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':')).toHaveLength(3);
    });
  });

  describe('decrypt', () => {
    beforeEach(async () => {
      jest.spyOn(secretsSupplier, 'get').mockResolvedValue({
        secret: validSecretKey,
      });
      await encryptionService.onModuleInit();
    });

    it('should decrypt encrypted text successfully', () => {
      const plainText = 'sensitive data';
      const encrypted = encryptionService.encrypt(plainText);

      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt special characters correctly', () => {
      const plainText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptionService.encrypt(plainText);

      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt unicode characters correctly', () => {
      const plainText = '你好世界 🚀 مرحبا';
      const encrypted = encryptionService.encrypt(plainText);

      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt long text correctly', () => {
      const plainText = 'a'.repeat(10000);
      const encrypted = encryptionService.encrypt(plainText);

      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw error when decrypting empty text', () => {
      expect(() => encryptionService.decrypt('')).toThrow(
        'Cannot decrypt empty text',
      );
    });

    it('should throw error when decrypting invalid format', () => {
      expect(() => encryptionService.decrypt('invalid')).toThrow(
        'Invalid encrypted text format',
      );
    });

    it('should throw error when decrypting text with wrong number of parts', () => {
      expect(() => encryptionService.decrypt('part1:part2')).toThrow(
        'Invalid encrypted text format',
      );
    });

    it('should throw error when decrypting with corrupted IV', () => {
      const plainText = 'sensitive data';
      const encrypted = encryptionService.encrypt(plainText);
      const parts = encrypted.split(':');
      const corruptedEncrypted = `corrupted:${parts[1]}:${parts[2]}`;

      expect(() => encryptionService.decrypt(corruptedEncrypted)).toThrow();
    });

    it('should throw error when decrypting with corrupted auth tag', () => {
      const plainText = 'sensitive data';
      const encrypted = encryptionService.encrypt(plainText);
      const parts = encrypted.split(':');
      const corruptedEncrypted = `${parts[0]}:corrupted:${parts[2]}`;

      expect(() => encryptionService.decrypt(corruptedEncrypted)).toThrow();
    });

    it('should throw error when decrypting with corrupted ciphertext', () => {
      const plainText = 'sensitive data';
      const encrypted = encryptionService.encrypt(plainText);
      const parts = encrypted.split(':');
      const corruptedEncrypted = `${parts[0]}:${parts[1]}:corrupted`;

      expect(() => encryptionService.decrypt(corruptedEncrypted)).toThrow();
    });
  });

  describe('encrypt and decrypt integration', () => {
    beforeEach(async () => {
      jest.spyOn(secretsSupplier, 'get').mockResolvedValue({
        secret: validSecretKey,
      });
      await encryptionService.onModuleInit();
    });

    it('should handle multiple encrypt/decrypt cycles', () => {
      const plainText = 'sensitive data';

      const encrypted1 = encryptionService.encrypt(plainText);
      const decrypted1 = encryptionService.decrypt(encrypted1);
      const encrypted2 = encryptionService.encrypt(decrypted1);
      const decrypted2 = encryptionService.decrypt(encrypted2);

      expect(decrypted1).toBe(plainText);
      expect(decrypted2).toBe(plainText);
    });

    it('should handle JSON data correctly', () => {
      const jsonData = JSON.stringify({
        username: 'user@example.com',
        password: 'secret123',
        metadata: { role: 'admin', permissions: ['read', 'write'] },
      });

      const encrypted = encryptionService.encrypt(jsonData);
      const decrypted = encryptionService.decrypt(encrypted);
      const parsed = JSON.parse(decrypted);

      expect(parsed.username).toBe('user@example.com');
      expect(parsed.password).toBe('secret123');
      expect(parsed.metadata.role).toBe('admin');
    });

    it('should maintain data integrity across multiple operations', () => {
      const testCases = [
        'simple text',
        'text with spaces and punctuation!',
        '12345',
        'mixed123ABC!@#',
        '{"key": "value"}',
      ];

      testCases.forEach((plainText) => {
        const encrypted = encryptionService.encrypt(plainText);
        const decrypted = encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(plainText);
      });
    });
  });
});
