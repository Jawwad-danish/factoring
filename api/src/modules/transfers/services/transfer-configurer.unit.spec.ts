import { createMock } from '@golevelup/ts-jest';
import { SECRETS_MANAGER, SecretsManager } from '@module-aws';
import { CONFIG_SERVICE, Config, ConfigService } from '@module-config';
import { Test, TestingModule } from '@nestjs/testing';
import { TransferConfigurer } from './transfer-configurer';

describe('TransferFeeFinder', () => {
  const configService = createMock<ConfigService>();
  const secretsManager = createMock<SecretsManager>();
  let transferConfigurer: TransferConfigurer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferConfigurer,
        { provide: CONFIG_SERVICE, useValue: configService },
        { provide: SECRETS_MANAGER, useValue: secretsManager },
      ],
    }).compile();

    transferConfigurer = module.get(TransferConfigurer);
  }, 60000);

  it('Should be defined', () => {
    expect(transferConfigurer).toBeDefined();
  });

  it('When internal bank account id is not configured it throws error', async () => {
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', undefined));

    expect(() => transferConfigurer.internalAccountId()).rejects.toThrowError();
  });

  it('When internal bank account id is found it return', async () => {
    const id = 'id';
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', 'secret-arn'));

    jest
      .spyOn(secretsManager, 'fromARN')
      .mockResolvedValueOnce({ INTERNAL_BANK_ACCOUNT_ID: id });

    const result = await transferConfigurer.internalAccountId();
    expect(result).toBe(id);
  });

  it('When api url is not found it throws error', async () => {
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', undefined));

    expect(() => transferConfigurer.webHookUrl()).toThrowError();
  });

  it('When api url is found it returns', async () => {
    const url = 'http://localhost';
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', url));

    expect(transferConfigurer.webHookUrl()).toBe(url);
  });
});
