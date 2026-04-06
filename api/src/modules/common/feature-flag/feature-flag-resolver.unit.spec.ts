import { createMock } from '@golevelup/ts-jest';
import { CONFIG_SERVICE, Config, ConfigService } from '@module-config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagResolver } from './feature-flag-resolver';
import { FeatureFlag } from './feature-flags';

describe('FeatureFlagResolver', () => {
  let configService: ConfigService;
  let featureFlagResolver: FeatureFlagResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagResolver,
        {
          provide: CONFIG_SERVICE,
          useValue: createMock<ConfigService>(),
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(CONFIG_SERVICE);
    featureFlagResolver = module.get(FeatureFlagResolver);
  }, 60000);

  it('Feature flag resolver should be defined', () => {
    expect(featureFlagResolver).toBeDefined();
  });

  it('When config is not found the feature flag resolver returns false', async () => {
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', undefined));

    const result = featureFlagResolver.isEnabled(
      FeatureFlag.InvoiceIssuesValidator,
    );

    expect(result).toBeFalsy();
  });

  it('When config is found and false the feature flag resolver returns false', async () => {
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', false));

    const result = featureFlagResolver.isEnabled(
      FeatureFlag.InvoiceIssuesValidator,
    );

    expect(result).toBeFalsy();
  });

  it('When config is found and true the feature flag resolver returns true', async () => {
    jest
      .spyOn(configService, 'getValue')
      .mockReturnValueOnce(new Config('', true));

    const result = featureFlagResolver.isEnabled(
      FeatureFlag.InvoiceIssuesValidator,
    );

    expect(result).toBeTruthy();
  });
});
