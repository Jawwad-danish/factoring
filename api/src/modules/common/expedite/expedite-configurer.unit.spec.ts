import { createMock } from '@golevelup/ts-jest';
import { CONFIG_SERVICE, Config, ConfigService } from '@module-config';
import { Test, TestingModule } from '@nestjs/testing';
import { ExpediteConfigurer } from './expedite-configurer';

describe('ExpediteFeeFinder', () => {
  const configService = createMock<ConfigService>();
  let expediteConfigurer: ExpediteConfigurer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpediteConfigurer,
        { provide: CONFIG_SERVICE, useValue: configService },
      ],
    }).compile();

    expediteConfigurer = module.get(ExpediteConfigurer);
  }, 60000);

  it('Should be defined', () => {
    expect(expediteConfigurer).toBeDefined();
  });

  it('When expedite fee configuration is not found it throws error', async () => {
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', undefined));

    expect(() => expediteConfigurer.expediteFee()).toThrowError();
  });

  it('When expedite fee configuration is found it returns', async () => {
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', '10'));

    const fee = expediteConfigurer.expediteFee();
    expect(fee.toNumber()).toBe(10);
  });
});
