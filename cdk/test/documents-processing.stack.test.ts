import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import {
  AppConfigStack,
  DeploymentStrategy,
} from '../lib/infrastructure/app-config.stack';
import { DocumentsProcessingStack } from '../lib/lambda/documents-processing/documents-processing.stack';
import { S3Stack } from '../lib/persistent/s3.stack';
import { SQSStack } from '../lib/infrastructure/sqs.stack';
import { envProps } from './test.props';
import { VpcStack } from '../lib/infrastructure/vpc.stack';
import { SecurityGroupStack } from '../lib/infrastructure/security-groups.stack';

describe('Documents Processing stack', () => {
  test('synthesizes the way we expect', () => {
    const app = new cdk.App();
    const sqsStack = new SQSStack(app, 'BobtailSQS', { envProps });
    const vpcStack = new VpcStack(app, 'BobtailVPC', { envProps });
    const sgStack = new SecurityGroupStack(app, 'SG', {
      vpc: vpcStack.vpc,
      envProps,
    });
    const appConfigStack = new AppConfigStack(app, 'BobtailAppConfig', {
      deploymentStrategy: DeploymentStrategy.QUICK,

      content: {
        auth0SecretArn: 'auth0_secret_arn',
        auth0M2MSecretArn: 'auth0_m2m_secret_arn',
        cognitoSecretArn: 'cognito_secret_arn',
        referralRockSecretArn: 'referral_rock_secret_arn',
        peruseSecretArn: 'peruse_secret_arn',
        launchDarklySecretArn: 'launch_darkly_secret_arn',
        twilioSecretArn: 'twilio_secret_arn',
        firebaseSecretArn: 'firebase_secret_arn',
        quickbooksSecretArn: 'quickbooks_secret_arn',
        encryptionSecretArn: 'encryption_secret_arn',
        invoiceDocumentsBucketName: 'invoice_docs_bucket',
        emailTemplatesBucketName: 'email_templates_bucket',
        reportTemplatesBucketName: 'report_templates_bucket',
        publicResourcesBucketName: 'public_resources_bucket',
        releaseLettersBucketName: 'release_letters_bucket',
        dbSecretARN: '123',
        invoiceDocsQueueURL: 'queue_url',
        filestackSecretArn: 'secret_arn',
        convertapiSecretArn: 'convertapi_arn',
        modernTreasurySecretArn: 'modern_treasury_arn',
        segmentSecretArn: 'segment_secret_arn',
        slackSecretArn: 'slack_secret_arn',
        clientApiUrl: 'clientApiUrl',
        brokerApiUrl: 'brokerApiUrl',
        transfersApiUrl: 'transfersApiUrl',
        v1ApiUrl: 'v1ApiUrl',
        albDomainAlias: 'albDomainAlias',
        wireDeadlineConfig: { start: { hour: 1 } },
        achTransferTimes: [
          {
            name: 'first_ach',
            cutoff: { hour: 11, minute: 0 },
            send: { hour: 13, minute: 0 },
          },
          {
            name: 'second_ach',
            cutoff: { hour: 17, minute: 0 },
            send: { hour: 19, minute: 0 },
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
        databaseReaderEndpointHost: 'reader_endpoint_host',
        workerJobsQueueURL: 'jobs_queue_url',
        reportsBucketName: 'reports_bucket_name',
        salesforceReportsBucketName: 'reports-salesforce',
      },
      envProps,
    });
    const s3Stack = new S3Stack(app, 'BobtailS3', { envProps });

    const lambdaStack = new DocumentsProcessingStack(
      app,
      'DocumentsProcessing',
      {
        envProps,
        executorProps: {
          queue: sqsStack.documentsQueue,
        },
        uploaderProps: {
          s3Bucket: s3Stack.invoiceBucket,
        },
        appConfigProps: {
          application: appConfigStack.application.name,
          environment: appConfigStack.appConfigEnvironment.name,
          profile: appConfigStack.profile.name,
        },
        secretsManagerProps: {
          filestackArn: '',
          convertapiArn: '',
          dbArn: '',
        },
        updateDocsProps: {
          apiUrl: 'http://example.com',
        },
        vpc: vpcStack.vpc,
        databaseSecurityGroup: sgStack.auroraSecurityGroup,
      },
    );

    const template = Template.fromStack(lambdaStack);
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      StateMachineName: `${envProps.shortName}-documents-processing`,
      StateMachineType: 'STANDARD',
      LoggingConfiguration: {
        IncludeExecutionData: true,
        Level: 'ALL',
      },
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${envProps.shortName}-documents-processing-proxy`,
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          NODE_ENV: 'testing',
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
      },
    });
    template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      BatchSize: 1,
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${envProps.shortName}-image-to-pdf`,
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          NODE_ENV: 'testing',
        },
      },
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${envProps.shortName}-compress-orient`,
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          NODE_ENV: 'testing',
        },
      },
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${envProps.shortName}-invoice-cover`,
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          NODE_ENV: 'testing',
        },
      },
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${envProps.shortName}-document-upload`,
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          NODE_ENV: 'testing',
        },
      },
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${envProps.shortName}-combine-pdf`,
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          NODE_ENV: 'testing',
        },
      },
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `${envProps.shortName}-update-docs-url`,
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          API_URL: 'http://example.com',
          NODE_ENV: 'testing',
        },
      },
    });
  });
});
