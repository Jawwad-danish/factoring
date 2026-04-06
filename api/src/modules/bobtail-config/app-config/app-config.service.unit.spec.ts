import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';
import { runPeriodically } from '@core/date-time';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import { mockClient } from 'aws-sdk-client-mock';
import { AppConfigParams } from '../config-params';
import {
  AppConfigService,
  DEFAULT_POLL_INTERVAL_SECONDS,
} from './app-config.service';

const TOKEN_START = 'TokenStart';
const TOKEN_NEXT = 'TokenNext';
const AWS_ERROR_MESSAGE = 'AWS error message';

const appConfigParams: AppConfigParams = {
  region: 'us-east-1',
  environment: 'development',
  application: 'Bobtail-NG',
  profile: 'General',
  enablePooling: true,
};

const appConfigDataInstance = mockClient(AppConfigDataClient);

jest.mock('@core/date-time/periodically', () => {
  return {
    runPeriodically: jest.fn(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

const mockStartConfigurationSession = (returnValue: {
  InitialConfigurationToken: string | undefined;
}) => {
  appConfigDataInstance
    .on(StartConfigurationSessionCommand)
    .resolves(returnValue);
};

const mockStartConfigurationSessionThrowsError = () => {
  appConfigDataInstance
    .on(StartConfigurationSessionCommand)
    .rejects(AWS_ERROR_MESSAGE);
};

const mockFetchLatestConfigurationWithJSONContent = () => {
  appConfigDataInstance.on(GetLatestConfigurationCommand).resolves({
    NextPollConfigurationToken: TOKEN_NEXT,
    ContentType: 'application/json',
    Configuration: Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({ key: 'value' }),
    ),
  });
};

const mockFetchLatestConfigurationNoToken = () => {
  appConfigDataInstance.on(GetLatestConfigurationCommand).resolves({
    NextPollConfigurationToken: undefined,
    ContentType: 'application/json',
    Configuration: Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({ key: 'value' }),
    ),
  });
};

const mockFetchLatestConfigurationThrowsError = () => {
  appConfigDataInstance
    .on(GetLatestConfigurationCommand)
    .rejects(AWS_ERROR_MESSAGE);
};
const mockFetchLatestConfigurationWithTextContent = () => {
  appConfigDataInstance.on(GetLatestConfigurationCommand).resolves({
    NextPollConfigurationToken: TOKEN_NEXT,
    ContentType: 'application/text',
    Configuration: Uint8ArrayBlobAdapter.fromString('key=value'),
  });
};

beforeEach(() => {
  appConfigDataInstance.reset();
  jest.clearAllMocks();
});

describe('AppConfigService', () => {
  test('Start configuration session is called', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: TOKEN_START });
    mockFetchLatestConfigurationWithJSONContent();

    const appConfigService = new AppConfigService(appConfigParams);
    await appConfigService.load();

    appConfigDataInstance.send.calledWith(
      expect.any(StartConfigurationSessionCommand),
    );
  });

  test('Start configuration session is called with correct params', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: TOKEN_START });
    mockFetchLatestConfigurationWithJSONContent();

    const appConfigService = new AppConfigService(appConfigParams);
    await appConfigService.load();

    const startSessionParams = (
      appConfigDataInstance.send.firstCall
        .args[0] as StartConfigurationSessionCommand
    ).input;
    expect(startSessionParams.ConfigurationProfileIdentifier).toBe(
      appConfigParams.profile,
    );
    expect(startSessionParams.ApplicationIdentifier).toBe(
      appConfigParams.application,
    );
    expect(startSessionParams.EnvironmentIdentifier).toBe(
      appConfigParams.environment,
    );
    expect(startSessionParams.RequiredMinimumPollIntervalInSeconds).toBe(
      DEFAULT_POLL_INTERVAL_SECONDS,
    );
  });

  test('Start configuration session throws error', async () => {
    mockStartConfigurationSessionThrowsError();
    mockFetchLatestConfigurationWithJSONContent();

    const appConfigService = new AppConfigService(appConfigParams);
    try {
      await appConfigService.load();
    } catch (error) {
      expect(error.message).toBe(AWS_ERROR_MESSAGE);
    }
  });

  test('Start configuration session has no initial token and throws error', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: undefined });
    mockFetchLatestConfigurationWithJSONContent();

    const appConfigService = new AppConfigService(appConfigParams);
    expect(appConfigService.load()).rejects.toThrow(
      'AWS AppConfig configuration session response does not have a configuration token',
    );
  });

  test('Fetch latest configuration throws error', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: TOKEN_START });
    mockFetchLatestConfigurationThrowsError();

    const appConfigService = new AppConfigService(appConfigParams);
    try {
      await appConfigService.load();
    } catch (error) {
      expect(error.message).toBe(AWS_ERROR_MESSAGE);
    }
  });

  test('Fetch latest configuration has no token and throws error', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: TOKEN_START });
    mockFetchLatestConfigurationNoToken();

    const appConfigService = new AppConfigService(appConfigParams);
    expect(appConfigService.load()).rejects.toThrow(
      'AWS AppConfig latest configuration response does not have a configuration token',
    );
  });

  test('Fetch latest configuration has no content', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: TOKEN_START });
    mockFetchLatestConfigurationNoToken();

    const appConfigService = new AppConfigService(appConfigParams);
    expect(appConfigService.load()).rejects.toThrow(
      'AWS AppConfig latest configuration response does not have a configuration token',
    );
  });

  test('Fetch latest configuration has text content and throws error', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: TOKEN_START });
    mockFetchLatestConfigurationWithTextContent();

    const appConfigService = new AppConfigService(appConfigParams);
    expect(appConfigService.load()).rejects.toThrow(
      'Could not parse latest AWS AppConfig configuration',
    );
  });

  test('Pooling is called if enabled', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: TOKEN_START });
    mockFetchLatestConfigurationWithJSONContent();

    const appConfigService = new AppConfigService(appConfigParams);
    await appConfigService.load();

    expect(runPeriodically).toBeCalled();
  });

  test('Pooling is not called if disabled', async () => {
    mockStartConfigurationSession({ InitialConfigurationToken: TOKEN_START });
    mockFetchLatestConfigurationWithJSONContent();

    const appConfigService = new AppConfigService({
      ...appConfigParams,
      enablePooling: false,
    });
    await appConfigService.load();

    expect(runPeriodically).toBeCalledTimes(0);
  });
});
