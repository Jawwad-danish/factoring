import * as dotenv from 'dotenv';

export enum CapacityProviders {
  FARGATE = 'FARGATE',
  FARGATE_SPOT = 'FARGATE_SPOT',
}
export interface EnvProps {
  accountId: string;
  remoteAccountId: string; // this is the bobtail 1.0 account
  region: string;
  shortName: string; // i.e. dev
  name: string; // i.e. development - used for NODE_ENV and extracted from CDK context
  vpcCidr: string;
  capacityProviders: CapacityProviders[];
  certificateArn: string;
  albDomainAlias: string; // invoice-api.bobtailtest.com
  vpcLogging: boolean; // whether or not to enable VPC flow logs
  albLogging: boolean; // whether or not to enable ALB logs
  isProd: boolean;
  clientApiUrl: string;
  brokerApiUrl: string;
  transfersApiUrl: string;
  v1ApiUrl: string;
  enableEmailService: boolean;
  featureFlagInvoiceEmails: boolean;
  sentryDsn: string;
  natGateways: number;
  noaEmailOrigin: string;
  bobtailEmailOrigin: string;
  noReplyEmailOrigin: string;
  emailCC: string[];
  convertApiUri: string;
  featureFlagSyncV1: boolean;
  featureFlagTagReassignment: boolean;
  featureFlagPurchaseClientStatusValidator: boolean;
  featureFlagUpdateClientPaymentStatusValidator: boolean;
  featureFlagPurchaseVerificationInProgress: boolean;
  featureFlagUseTransfersApi: boolean;
  featureFlagSegment: boolean;
  featureFlagNotifications: boolean;
  featureFlagEnablePeruseCron: boolean;
  featureFlagEnableVerificationEngine: boolean;
  peruseCron?: string;
  slackWorkspaceId: string;
  slackCICDChannelId: string;
  alarmMemoryThreshold: number;
  alarmCpuThreshold: number;

  taskCpu: number;
  taskMemory: number;
  containerCpu: number;
  containerMemory: number;
  minContainerCapacity: number;
  maxContainerCapacity: number;

  // Worker specific resources
  workerTaskCpu: number;
  workerTaskMemory: number;
  workerContainerCpu: number;
  workerContainerMemory: number;
}

export const getEnvProps = (env: string): EnvProps => {
  dotenv.config({ path: `envs/${env}.env` });

  return {
    shortName: process.env.ENV_SHORT_NAME || 'ic-dev',
    name: env,
    accountId: process.env.AWS_ACCOUNT_ID || '',
    remoteAccountId: process.env.AWS_REMOTE_ACCOUNT_ID || '',
    region: process.env.AWS_REGION || 'us-east-1',
    vpcCidr: process.env.VPC_CIDR || '',
    certificateArn: process.env.CERRTIFICATE_ARN || '',
    albDomainAlias: process.env.ALB_DOMAIN_ALIAS || '',
    vpcLogging: process.env.VPC_LOGGING === 'true' ? true : false,
    albLogging: process.env.ALB_LOGGING === 'true' ? true : false,
    isProd: env === 'production' ? true : false,
    clientApiUrl: process.env.CLIENT_SERVICE_URL || '',
    brokerApiUrl: process.env.BROKER_SERVICE_URL || '',
    transfersApiUrl: process.env.TRANSFERS_SERVICE_URL || '',
    v1ApiUrl: process.env.V1_API_URL || '',
    sentryDsn:
      process.env.SENTRY_DSN ||
      'https://492d0621953c44009992c258a6946f1c@o386496.ingest.sentry.io/4505079527571456',
    enableEmailService:
      process.env.ENABLE_EMAIL_SERVICE?.toLocaleLowerCase() === 'true'
        ? true
        : false,
    featureFlagInvoiceEmails:
      process.env.FEATURE_FLAG_INVOICE_EMAILS?.toLocaleLowerCase() === 'true'
        ? true
        : false,
    capacityProviders: (
      process.env.CAPACITY_PROVIDERS || 'FARGATE,FARGATE_SPOT'
    )
      .split(',')
      .filter((e) => isCapacityProvider(e))
      .map((e) => e as CapacityProviders),
    natGateways: parseInt(process.env.NAT_GATEWAYS || '1'),
    noaEmailOrigin: process.env.NOA_EMAIL_ORIGIN || '',
    bobtailEmailOrigin: process.env.BOBTAIL_EMAIL_ORIGIN || '',
    noReplyEmailOrigin: process.env.NO_REPLY_EMAIL_ORIGIN || '',
    emailCC: process.env.EMAIL_CC?.split(',') || [],
    convertApiUri: process.env.CONVERT_API_URI || 'https://v2.convertapi.com',
    featureFlagSyncV1:
      process.env.FEATURE_FLAG_SYNC_V1?.toLowerCase() === 'true',
    featureFlagUseTransfersApi:
      process.env.FEATURE_FLAG_USE_TRANSFERS_API?.toLowerCase() === 'true',
    featureFlagTagReassignment:
      process.env.FEATURE_FLAG_TAG_REASSIGNMENT?.toLowerCase() === 'true',
    featureFlagPurchaseClientStatusValidator:
      process.env.FEATURE_FLAG_PURCHASE_INVOICE_CLIENT_STATUS?.toLowerCase() ===
      'true',
    featureFlagUpdateClientPaymentStatusValidator:
      process.env.FEATURE_FLAG_UPDATE_INVOICE_CLIENT_PAYMENT_STATUS?.toLocaleLowerCase() ===
      'true',
    featureFlagPurchaseVerificationInProgress:
      process.env.FEATURE_FLAG_PURCHASE_VERIFICATION_IN_PROGRESS?.toLowerCase() ===
      'true',
    featureFlagEnableVerificationEngine:
      process.env.FEATURE_FLAG_VERIFICATION_ENGINE?.toLowerCase() === 'true',
    featureFlagSegment:
      process.env.FEATURE_FLAG_SEGMENT?.toLowerCase() === 'true',
    featureFlagNotifications:
      process.env.FEATURE_FLAG_NOTIFICATIONS?.toLowerCase() === 'true',
    featureFlagEnablePeruseCron:
      process.env.FEATURE_FLAG_ENABLE_PERUSE_CRON?.toLowerCase() === 'true',
    peruseCron: process.env.PERUSE_SYNC_CRON,
    slackWorkspaceId: process.env.SLACK_WORKSPACE_ID || '',
    slackCICDChannelId: process.env.SLACK_CICD_CHANNEL_ID || '',
    alarmMemoryThreshold: Number(process.env.ALARM_MEMORY_THRESHOLD) || 50,
    alarmCpuThreshold: Number(process.env.ALARM_CPU_THRESHOLD) || 50,

    taskCpu: Number(process.env.TASK_CPU),
    taskMemory: Number(process.env.TASK_MEMORY),
    containerCpu: Number(process.env.CONTAINER_CPU),
    containerMemory: Number(process.env.CONTAINER_MEMORY),
    minContainerCapacity: Number(process.env.MIN_CONTAINER_CAPACITY),
    maxContainerCapacity: Number(process.env.MAX_CONTAINER_CAPACITY),

    workerTaskCpu: Number(process.env.WORKER_TASK_CPU),
    workerTaskMemory: Number(process.env.WORKER_TASK_MEMORY),
    workerContainerCpu: Number(process.env.WORKER_CONTAINER_CPU),
    workerContainerMemory: Number(process.env.WORKER_CONTAINER_MEMORY),
  };
};

function isCapacityProvider(value: string): value is CapacityProviders {
  return Object.values(CapacityProviders).includes(value as CapacityProviders);
}
