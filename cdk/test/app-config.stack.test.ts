import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import {
  AppConfigStack,
  DeploymentStrategy,
  ID_APPLICATION,
  ID_DEPLOYMENT_STRATEGY,
  ID_HOSTED_CONFIGURATION,
  ID_PROFILE,
} from '../lib/infrastructure/app-config.stack';
import { envProps } from './test.props';

describe('AppConfig Stack', () => {
  test('synthesizes the way we expect', () => {
    const app = new cdk.App();
    const stack = new AppConfigStack(app, 'BobtailAppConfig', {
      deploymentStrategy: DeploymentStrategy.QUICK,

      content: {
        invoiceDocumentsBucketName: 'invoice_docs_bucket',
        emailTemplatesBucketName: 'email_templates_bucket',
        publicResourcesBucketName: 'public_resources_bucket',
        releaseLettersBucketName: 'release_letters_bucket',
        reportsBucketName: 'reports_bucket',
        salesforceReportsBucketName: 'reports-salesforce',
        reportTemplatesBucketName: 'report_templates_bucket',
        dbSecretARN: '123',
        invoiceDocsQueueURL: 'queue_url',
        workerJobsQueueURL: 'jobs_queue_url',
        databaseReaderEndpointHost: 'reader_endpoint',
        filestackSecretArn: 'secret_arn',
        referralRockSecretArn: 'secret_arn',
        convertapiSecretArn: 'convertapi_arn',
        modernTreasurySecretArn: 'modern_treasury_arn',
        slackSecretArn: 'slack_secret_arn',
        segmentSecretArn: 'segment_secret_arn',
        peruseSecretArn: 'peruse_secret_arn',
        launchDarklySecretArn: 'launch_darkly_secret_arn',
        twilioSecretArn: 'twilio_secret_arn',
        firebaseSecretArn: 'firebase_secret_arn',
        quickbooksSecretArn: 'quickbooks_secret_arn',
        encryptionSecretArn: 'encryption_secret_arn',
        clientApiUrl: 'clientApiUrl',
        brokerApiUrl: 'brokerApiUrl',
        transfersApiUrl: 'transfersApiUrl',
        v1ApiUrl: 'v1ApiUrl',
        albDomainAlias: 'albDomainAlias',
        wireDeadlineConfig: { start: { hour: 1 } },
        achTransferTimes: [
          {
            cutoff: { hour: 11, minute: 0 },
            name: 'first',
            send: { hour: 13, minute: 0 },
          },
        ],
        achArrivalTransferTimes: [
          {
            arrival: { hour: 17, minute: 0 },
            name: 'first_ach_arrival',
          },
          {
            arrival: { hour: 8, minute: 0 },
            name: 'second_ach_arrival',
          },
        ],
        auth0SecretArn: 'auth0_secret_arn',
        auth0M2MSecretArn: 'auth0_m2m_secret_arn',
        cognitoSecretArn: 'cognito_secret_arn',
        enableEmailService: false,
        featureFlagInvoiceEmails: false,
        sentryDsn: 'http://sentry',
        noaEmailOrigin: '',
        convertApiUri: 'uri',
        bobtailEmailOrigin: '',
        noReplyEmailOrigin: '',
        emailCC: [],
        featureFlagInvoiceIssues: false,
        featureFlagVerificationEngine: false,
        featureFlagBrokerPaymentInvoicePaidValidator: true,
        featureFlagUpdateInvoiceClientPaymentStatusValidator: false,
        featureFlagPurchaseClientStatusValidator: false,
        featureFlagClientStatusReserves: false,
        expediteFee: 1800,
        featureFlagEnableDocumentProcessing: true,
        featureFlagSyncV1: false,
        featureFlagTagReassignment: true,
        featureFlagPurchaseVerificationInProgress: true,
        featureFlagUseTransfersApi: false,
        featureFlagSegment: false,
        featureFlagNotifications: false,
        featureFlagEnablePeruseCron: false,
        peruseCron: '',
      },
      envProps,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::AppConfig::Application', {
      Name: stack.application.name,
    });
    template.hasResourceProperties('AWS::AppConfig::Environment', {
      ApplicationId: {
        Ref: ID_APPLICATION,
      },
    });
    template.hasResourceProperties('AWS::AppConfig::ConfigurationProfile', {
      ApplicationId: {
        Ref: ID_APPLICATION,
      },
      LocationUri: 'hosted',
    });
    template.hasResourceProperties('AWS::AppConfig::DeploymentStrategy', {
      Name: stack.deploymentStrategy.name,
    });
    template.hasResourceProperties(
      'AWS::AppConfig::HostedConfigurationVersion',
      {
        ApplicationId: {
          Ref: ID_APPLICATION,
        },
        ConfigurationProfileId: {
          Ref: ID_PROFILE,
        },
      },
    );
    template.hasResourceProperties('AWS::AppConfig::Deployment', {
      ApplicationId: {
        Ref: ID_APPLICATION,
      },
      ConfigurationProfileId: {
        Ref: ID_PROFILE,
      },
      DeploymentStrategyId: {
        Ref: ID_DEPLOYMENT_STRATEGY,
      },
      EnvironmentId: {
        Ref: 'testing',
      },
    });
    template.hasResourceProperties(
      'AWS::AppConfig::HostedConfigurationVersion',
      {},
    );

    const appConfigBaseConfiguration = template.findResources(
      'AWS::AppConfig::HostedConfigurationVersion',
    )[ID_HOSTED_CONFIGURATION];
    expect(appConfigBaseConfiguration).toBeDefined();

    const content = JSON.parse(appConfigBaseConfiguration.Properties.Content);
    expect(content).toHaveProperty('DB_SECRET_ARN');
    expect(content).toHaveProperty('SENTRY_DSN');
  });
});
