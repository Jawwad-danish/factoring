import { App, Stack, StackProps } from 'aws-cdk-lib';
import {
  CfnApplication,
  CfnConfigurationProfile,
  CfnDeployment,
  CfnDeploymentStrategy,
  CfnEnvironment,
  CfnHostedConfigurationVersion,
} from 'aws-cdk-lib/aws-appconfig';
import { EnvProps } from '../cdk.config';

export const ID_APPLICATION = 'BobtailAppConfig';
export const ID_ENVIRONMENT = 'BobtailAppConfigEnvironment';
export const ID_PROFILE = 'BobtailAppConfigProfile';
export const ID_DEPLOYMENT_STRATEGY = 'BobtailAppConfigDeploymentStrategy';
export const ID_HOSTED_CONFIGURATION = 'EmptyConfig';
export const ID_DEPLOYMENT = 'BobtailAppConfigDeployment';
export const APPLICATION_NAME = 'Bobtail-NG';

export enum DeploymentStrategy {
  QUICK,
  LINEAR_50_PERCENT,
}

enum LogLevels {
  DEBUG = 'debug',
  VERBOSE = 'verbose',
  LOG = 'log',
  WARN = 'warn',
  ERROR = 'error',
}

export interface AppConfigContent {
  dbSecretARN: string;
  databaseReaderEndpointHost: string;
  auth0SecretArn: string;
  auth0M2MSecretArn: string;
  cognitoSecretArn: string;
  filestackSecretArn: string;
  referralRockSecretArn: string;
  convertapiSecretArn: string;
  modernTreasurySecretArn: string;
  slackSecretArn: string;
  segmentSecretArn: string;
  peruseSecretArn: string;
  launchDarklySecretArn: string;
  twilioSecretArn: string;
  firebaseSecretArn: string;
  quickbooksSecretArn: string;
  encryptionSecretArn: string;
  invoiceDocsQueueURL: string;
  workerJobsQueueURL: string;
  invoiceDocumentsBucketName: string;
  emailTemplatesBucketName: string;
  reportTemplatesBucketName: string;
  publicResourcesBucketName: string;
  releaseLettersBucketName: string;
  reportsBucketName: string;
  salesforceReportsBucketName: string;
  clientApiUrl: string;
  brokerApiUrl: string;
  transfersApiUrl: string;
  albDomainAlias: string;
  v1ApiUrl: string;
  wireDeadlineConfig: Record<string, Record<string, number>>;
  achTransferTimes: {
    cutoff: { hour: number; minute: number };
    send: { hour: number; minute: number };
    name: string;
    next?: string;
    previous?: string;
  }[];
  achArrivalTransferTimes: {
    name: string;
    arrival: { hour: number; minute: number };
  }[];
  enableEmailService: boolean;
  featureFlagInvoiceEmails: boolean;
  sentryDsn: string;
  noaEmailOrigin: string;
  bobtailEmailOrigin: string;
  noReplyEmailOrigin: string;
  emailCC: string[];
  convertApiUri: string;
  featureFlagInvoiceIssues: boolean;
  featureFlagVerificationEngine: boolean;
  featureFlagBrokerPaymentInvoicePaidValidator: boolean;
  featureFlagPurchaseClientStatusValidator: boolean;
  featureFlagUpdateInvoiceClientPaymentStatusValidator: boolean;
  featureFlagTagReassignment: boolean;
  featureFlagPurchaseVerificationInProgress: boolean;
  featureFlagClientStatusReserves: boolean;
  expediteFee: number;
  featureFlagEnableDocumentProcessing: boolean;
  featureFlagSyncV1: boolean;
  featureFlagUseTransfersApi: boolean;
  featureFlagSegment: boolean;
  featureFlagNotifications: boolean;
  featureFlagEnablePeruseCron: boolean;
  peruseCron?: string;
}
export interface AppConfigProps extends StackProps {
  deploymentStrategy?: DeploymentStrategy;
  content: AppConfigContent;
  envProps: EnvProps;
}

export class AppConfigStack extends Stack {
  readonly application: CfnApplication;
  readonly profile: CfnConfigurationProfile;
  readonly deploymentStrategy: CfnDeploymentStrategy;
  readonly appConfigEnvironment: CfnEnvironment;

  constructor(scope: App, id: string, private props: AppConfigProps) {
    super(scope, id, props);

    this.application = new CfnApplication(this, ID_APPLICATION, {
      name: APPLICATION_NAME,
      description: 'Configuration for bobtail-ng',
    });

    // // we need to create all envs at once
    const appConfigEnvs: Record<string, CfnEnvironment> = {
      Development: new CfnEnvironment(this, ID_ENVIRONMENT, {
        name: 'Development',
        description: 'Development environment for bobtail-ng',
        applicationId: this.application.ref,
      }),
      development: new CfnEnvironment(this, 'development', {
        name: 'development',
        description: 'development environment for bobtail-ng',
        applicationId: this.application.ref,
      }),
      staging: new CfnEnvironment(this, 'staging', {
        name: 'staging',
        description: 'staging environment for bobtail-ng',
        applicationId: this.application.ref,
      }),
      production: new CfnEnvironment(this, 'production', {
        name: 'production',
        description: 'production environment for bobtail-ng',
        applicationId: this.application.ref,
      }),
      testing: new CfnEnvironment(this, 'testing', {
        name: 'testing',
        description: 'testing environment for bobtail-ng',
        applicationId: this.application.ref,
      }),
      local: new CfnEnvironment(this, 'local', {
        name: 'local',
        description: 'local environment for bobtail-ng',
        applicationId: this.application.ref,
      }),
    };

    // then choose the one to work with based on existing env
    this.appConfigEnvironment = appConfigEnvs[props.envProps.name];

    this.profile = new CfnConfigurationProfile(this, ID_PROFILE, {
      name: `General`,
      locationUri: 'hosted',
      applicationId: this.application.ref,
    });
    this.deploymentStrategy = this.getDeploymentStrategy(
      props.deploymentStrategy,
    );

    this.deployInitialVersion(props.content);
  }

  private deployInitialVersion(content?: AppConfigContent): void {
    const emptyConfiguration = new CfnHostedConfigurationVersion(
      this,
      ID_HOSTED_CONFIGURATION,
      {
        applicationId: this.application.ref,
        configurationProfileId: this.profile.ref,
        contentType: 'application/json',
        content: JSON.stringify({
          DB_SECRET_ARN: content?.dbSecretARN,
          DB_READER_ENDPOINT_HOST: content?.databaseReaderEndpointHost,
          AUTH0_SECRET_ARN: content?.auth0SecretArn,
          AUTH0_M2M_SECRET_ARN: content?.auth0M2MSecretArn,
          COGNITO_SECRET_ARN: content?.cognitoSecretArn,
          FILESTACK_SECRET_ARN: content?.filestackSecretArn,
          REFERRAL_ROCK_SECRET_ARN: content?.referralRockSecretArn,
          CONVERTAPI_SECRET_ARN: content?.convertapiSecretArn,
          MODERN_TREASURY_SECRET_ARN: content?.modernTreasurySecretArn,
          SLACK_SECRET_ARN: content?.slackSecretArn,
          SEGMENT_SECRET_ARN: content?.segmentSecretArn,
          PERUSE_SECRET_ARN: content?.peruseSecretArn,
          LAUNCH_DARKLY_SECRET_ARN: content?.launchDarklySecretArn,
          TWILIO_SECRET_ARN: content?.twilioSecretArn,
          FIREBASE_SECRET_ARN: content?.firebaseSecretArn,
          QUICKBOOKS_SECRET_ARN: content?.quickbooksSecretArn,
          ENCRYPTION_SECRET_ARN: content?.encryptionSecretArn,
          INVOICE_DOCUMENTS_QUEUE_URL: content?.invoiceDocsQueueURL,
          WORKER_JOBS_QUEUE_URL: content?.workerJobsQueueURL,
          INVOICE_COVER_TEMPLATE_BUCKET: content?.invoiceDocumentsBucketName,
          EMAIL_TEMPLATES_BUCKET:
            content?.emailTemplatesBucketName || 'bobtail-email-templates',
          REPORT_TEMPLATES_BUCKET:
            content?.reportTemplatesBucketName || 'bobtail-report-templates',
          PUBLIC_RESOURCES_BUCKET:
            content?.publicResourcesBucketName || 'public-resources',
          RELEASE_LETTERS_BUCKET:
            content?.releaseLettersBucketName || 'release-letters',
          REPORTS_BUCKET: content?.reportsBucketName,
          SALESFORCE_REPORTS_BUCKET: content?.salesforceReportsBucketName,
          CLIENT_SERVICE_URL: content?.clientApiUrl,
          BROKER_SERVICE_URL: content?.brokerApiUrl,
          TRANSFERS_SERVICE_URL: content?.transfersApiUrl,
          V1_API_URL: content?.v1ApiUrl,
          INVOICE_COVER_TEMPLATE_KEY:
            'invoice-cover-template-files/invoice.html',
          WIRE_TRANSFER_OVERRIDE_WINDOW: content?.wireDeadlineConfig,
          ACH_TRANSFER_TIMES: content?.achTransferTimes,
          ACH_ARRIVAL_TRANSFER_TIMES: content?.achArrivalTransferTimes,
          NOA_EMAIL_ORIGIN: content?.noaEmailOrigin,
          BOBTAIL_EMAIL_ORIGIN: content?.bobtailEmailOrigin,
          NO_REPLY_EMAIL_ORIGIN: content?.noReplyEmailOrigin,
          ENABLE_SENTRY: true,
          JWT_SECURITY_STRATEGY: 'auth0',
          ENABLE_EMAIL_SERVICE: content?.enableEmailService,
          FEATURE_FLAG_INVOICE_EMAILS: content?.featureFlagInvoiceEmails,
          SENTRY_DSN: content?.sentryDsn,
          LOG_LEVEL: LogLevels.DEBUG,
          FEATURE_FLAG_ENABLE_PERUSE_CRON:
            content?.featureFlagEnablePeruseCron || false,
          PERUSE_SYNC_CRON: content?.peruseCron || '*/5 * * * *', // every 5 minutes
          ENABLE_CLIENT_CONFIG_SYNC_CRON: true,
          SYNC_QUICKBOOKS_CLIENTS_CRON: '30 1 * * *',
          ENABLE_CLIENT_SERVICE_SYNC_CRON: true,
          CLIENT_SERVICE_SYNC_CRON: '0 2 * * *', // every day at 2 am
          CONVERT_API_URI:
            content?.convertApiUri || 'https://v2.convertapi.com',
          ALB_DOMAIN_ALIAS: content?.albDomainAlias,
          FEATURE_FLAG_INVOICE_ISSUES: content?.featureFlagInvoiceIssues,
          FEATURE_FLAG_VERIFICATION_ENGINE:
            content?.featureFlagVerificationEngine,
          FEATURE_FLAG_BROKER_PAYMENT_VERIFY_INVOICE_PAID:
            content?.featureFlagBrokerPaymentInvoicePaidValidator,
          FEATURE_FLAG_PURCHASE_INVOICE_CLIENT_STATUS:
            content?.featureFlagPurchaseClientStatusValidator,
          FEATURE_FLAG_UPDATE_INVOICE_CLIENT_PAYMENT_STATUS:
            content?.featureFlagUpdateInvoiceClientPaymentStatusValidator,
          FEATURE_FLAG_TAG_REASSIGNMENT: content?.featureFlagTagReassignment,
          FEATURE_FLAG_PURCHASE_VERIFICATION_IN_PROGRESS:
            content?.featureFlagPurchaseVerificationInProgress,
          FEATURE_FLAG_CLIENT_STATUS_RESERVES:
            content?.featureFlagClientStatusReserves,
          EXPEDITE_FEE: content?.expediteFee,
          FEATURE_FLAG_ENABLE_DOCUMENT_PROCESSING:
            content?.featureFlagEnableDocumentProcessing,
          FEATURE_FLAG_SYNC_V1: content?.featureFlagSyncV1,
          FEATURE_FLAG_USE_TRANSFERS_API: content?.featureFlagUseTransfersApi,
          FEATURE_FLAG_SEGMENT: content?.featureFlagSegment,
          FEATURE_FLAG_NOTIFICATIONS: content?.featureFlagNotifications,
        }),
      },
    );

    new CfnDeployment(this, ID_DEPLOYMENT, {
      applicationId: this.application.ref,
      configurationProfileId: this.profile.ref,
      configurationVersion: emptyConfiguration.ref,
      deploymentStrategyId: this.deploymentStrategy.ref,
      environmentId: this.appConfigEnvironment.ref,
    });
  }

  private getDeploymentStrategy(
    deploymentStrategy?: DeploymentStrategy,
  ): CfnDeploymentStrategy {
    switch (deploymentStrategy) {
      case DeploymentStrategy.LINEAR_50_PERCENT:
        return this.buildDefaultDeploymentStrategy();
      case DeploymentStrategy.QUICK:
        return this.buildQuickDeploymentStrategy();
      default:
        return this.buildDefaultDeploymentStrategy();
    }
  }

  private buildDefaultDeploymentStrategy(): CfnDeploymentStrategy {
    return new CfnDeploymentStrategy(this, ID_DEPLOYMENT_STRATEGY, {
      deploymentDurationInMinutes: 1,
      growthFactor: 50,
      name: 'Linear50PercentEvery30Seconds',
      growthType: 'LINEAR',
      replicateTo: 'NONE',
    });
  }

  private buildQuickDeploymentStrategy(): CfnDeploymentStrategy {
    return new CfnDeploymentStrategy(this, ID_DEPLOYMENT_STRATEGY, {
      deploymentDurationInMinutes: 0,
      growthFactor: 100,
      name: 'QuickDeployment',
      growthType: 'LINEAR',
      replicateTo: 'NONE',
      description: 'Deploy all with no bake time',
    });
  }
}
