import { App, Stack, StackProps } from 'aws-cdk-lib';
import { EnvProps } from './cdk.config';
import {
  AppConfigStack,
  DeploymentStrategy,
} from './infrastructure/app-config.stack';
import { BastionStack } from './infrastructure/bastion.stack';
import { CloudWatchAlarmsStack } from './infrastructure/cloudwatch-alarms.stack';
import { SecretsManagerStack } from './infrastructure/secrets-manager.stack';
import { SecurityGroupStack } from './infrastructure/security-groups.stack';
import { SQSStack } from './infrastructure/sqs.stack';
import { VpcStack } from './infrastructure/vpc.stack';
import { WafRegionalStack } from './infrastructure/waf.stack';
import { InvoiceApiStack } from './invoice-api/invoice-api.stack';
import { DispatcherStack } from './lambda/dispatcher';
import { DocumentsProcessingStack } from './lambda/documents-processing/documents-processing.stack';
import { AuroraStack } from './persistent/aurora.stack';
import { EcrStack } from './persistent/ecr.stack';
import { S3Stack } from './persistent/s3.stack';
import { WorkerStack } from './worker/worker.stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface CdkStackProps extends StackProps {
  envProps: EnvProps;
}

const createEcsCluster = (
  scope: Construct,
  vpc: ec2.Vpc,
  envProps: EnvProps,
): ecs.Cluster => {
  return new ecs.Cluster(scope, `${envProps.shortName}-Cluster`, {
    vpc: vpc,
    clusterName: `${envProps.shortName}-v2-cluster`,
    containerInsights: true,
    enableFargateCapacityProviders: true,
  });
};

export class CdkStack extends Stack {
  constructor(scope: App, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const s3Stack = new S3Stack(scope, `${props.envProps.shortName}-S3`, {
      ...props,
      description: `${props.envProps.shortName} S3 Stack`,
    });

    // Networking
    // only 1 WAF for all infra
    new WafRegionalStack(scope, 'WAF', { ...props, description: 'WAF Stack' });

    const vpcStack = new VpcStack(scope, `${props.envProps.shortName}-VPC`, {
      ...props,
      loggingBucket: s3Stack.loggingBucket,
      description: `${props.envProps.shortName} VPC Stack`,
    });

    const sgStack = new SecurityGroupStack(
      scope,
      `${props.envProps.shortName}-SG`,
      {
        ...props,
        vpc: vpcStack.vpc,
        description: `${props.envProps.shortName} Security Groups Stack`,
      },
    );

    // Persistent
    // no prefix since we use 1ECR for all env's
    const ecrStack = new EcrStack(scope, `ECR`, {
      ...props,
      description: `ECR Stack`,
    });

    // no prefix since we use 1SM for all env's
    const secretsManagerStack = new SecretsManagerStack(
      scope,
      `BobtailSecretsManager`,
      {
        ...props,
        description: 'Bobtail Secrets Manager Stack',
      },
    );

    new BastionStack(scope, `${props.envProps.shortName}-Bastion`, {
      ...props,
      description: `${props.envProps.shortName} Bastion Stack`,
      vpc: vpcStack.vpc,
      securityGroup: sgStack.bastionSecurityGroup,
    });

    const auroraStack = new AuroraStack(
      scope,
      `${props.envProps.shortName}-Aurora`,
      {
        ...props,
        description: `${props.envProps.shortName} Aurora Stack`,
        vpc: vpcStack.vpc,
        auroraSecurityGroup: sgStack.auroraSecurityGroup,
      },
    );

    // Interconectivity
    const sqsStack = new SQSStack(scope, `${props.envProps.shortName}-SQS`, {
      ...props,
      description: `${props.envProps.shortName} SQS Stack`,
    });

    const appConfigStack = new AppConfigStack(scope, `BobtailAppConfig`, {
      ...props,
      description: `Bobtail AppConfig Stack`,
      deploymentStrategy: DeploymentStrategy.QUICK,
      content: {
        dbSecretARN: auroraStack.dbSecretARN,
        databaseReaderEndpointHost: auroraStack.readerEndpointHost,
        auth0SecretArn: secretsManagerStack.auth0Secret.secretArn,
        auth0M2MSecretArn: secretsManagerStack.auth0M2MSecret.secretArn,
        cognitoSecretArn: secretsManagerStack.cognitoSecret.secretArn,
        filestackSecretArn: secretsManagerStack.filestackSecret.secretArn,
        referralRockSecretArn: secretsManagerStack.referralRockSecret.secretArn,
        peruseSecretArn: secretsManagerStack.peruseSecret.secretArn,
        launchDarklySecretArn: secretsManagerStack.launchDarklySecret.secretArn,
        twilioSecretArn: secretsManagerStack.twilioSecret.secretArn,
        firebaseSecretArn: secretsManagerStack.firebaseSecret.secretArn,
        quickbooksSecretArn: secretsManagerStack.quickbooksSecret.secretArn,
        encryptionSecretArn: secretsManagerStack.encryptionSecret.secretArn,
        invoiceDocsQueueURL: sqsStack.documentsQueue.queueUrl,
        workerJobsQueueURL: sqsStack.workerJobsQueue.queueUrl,
        invoiceDocumentsBucketName: s3Stack.invoiceBucket.bucketName,
        reportsBucketName: s3Stack.reportsBucket.bucketName,
        salesforceReportsBucketName: s3Stack.reportsSalesforceBucket.bucketName,
        emailTemplatesBucketName: s3Stack.emailTemplatesBucket.bucketName,
        reportTemplatesBucketName: s3Stack.reportTemplatesBucket.bucketName,
        publicResourcesBucketName: s3Stack.publicResourcesBucket.bucketName,
        releaseLettersBucketName: s3Stack.releaseLettersBucket.bucketName,
        convertapiSecretArn: secretsManagerStack.convertapiSecret.secretArn,
        modernTreasurySecretArn:
          secretsManagerStack.modernTreasurySecret.secretArn,
        slackSecretArn: secretsManagerStack.slackSecret.secretArn,
        segmentSecretArn: secretsManagerStack.segmentSecret.secretArn,
        clientApiUrl: props.envProps.clientApiUrl,
        brokerApiUrl: props.envProps.brokerApiUrl,
        transfersApiUrl: props.envProps.transfersApiUrl,
        v1ApiUrl: props.envProps.v1ApiUrl,
        albDomainAlias: props.envProps.albDomainAlias,
        enableEmailService: props.envProps.enableEmailService,
        featureFlagInvoiceEmails: props.envProps.featureFlagInvoiceEmails,
        wireDeadlineConfig: {
          start: { hour: 16, minute: 50 },
          end: { hour: 22, minute: 0 },
        },
        achTransferTimes: [
          {
            name: 'first_ach',
            cutoff: { hour: 11, minute: 0 },
            send: { hour: 13, minute: 0 },
            next: 'second_ach',
          },
          {
            name: 'second_ach',
            cutoff: { hour: 19, minute: 0 },
            send: { hour: 22, minute: 0 },
            previous: 'first_ach',
          },
        ],
        achArrivalTransferTimes: [
          {
            name: 'first_ach_arrival',
            arrival: { hour: 17, minute: 0 },
          },
          {
            name: 'second_ach_arrival',
            arrival: { hour: 8, minute: 0 },
          },
        ],
        sentryDsn: props.envProps.sentryDsn,
        noaEmailOrigin: props.envProps.noaEmailOrigin,
        bobtailEmailOrigin: props.envProps.bobtailEmailOrigin,
        noReplyEmailOrigin: props.envProps.noReplyEmailOrigin,
        emailCC: props.envProps.emailCC,
        convertApiUri: props.envProps.convertApiUri,
        featureFlagInvoiceIssues: false,
        featureFlagVerificationEngine:
          props.envProps.featureFlagEnableVerificationEngine,
        featureFlagBrokerPaymentInvoicePaidValidator: true,
        featureFlagUpdateInvoiceClientPaymentStatusValidator: false,
        featureFlagClientStatusReserves: false,
        expediteFee: 1800,
        featureFlagEnableDocumentProcessing: false,
        featureFlagSyncV1: props.envProps.featureFlagSyncV1,
        featureFlagPurchaseClientStatusValidator:
          props.envProps.featureFlagPurchaseClientStatusValidator,
        featureFlagTagReassignment: props.envProps.featureFlagTagReassignment,
        featureFlagPurchaseVerificationInProgress:
          props.envProps.featureFlagPurchaseVerificationInProgress,
        featureFlagUseTransfersApi: props.envProps.featureFlagUseTransfersApi,
        featureFlagSegment: props.envProps.featureFlagSegment,
        featureFlagNotifications: props.envProps.featureFlagNotifications,
        featureFlagEnablePeruseCron: props.envProps.featureFlagEnablePeruseCron,
        peruseCron: props.envProps.peruseCron,
      },
    });

    const cluster = createEcsCluster(this, vpcStack.vpc, props.envProps);

    // Compute and Runtime
    const invoiceApiStack = new InvoiceApiStack(
      scope,
      `${props.envProps.shortName}-InvoiceApi`,
      {
        ...props,
        description: `${props.envProps.shortName} InvoiceApi Stack`,
        vpc: vpcStack.vpc,
        cluster: cluster,
        ecrRepository: ecrStack.ecrRepository,
        serviceSecurityGroup: sgStack.fargateSecurityGroup,
        albSecurityGroup: sgStack.albSecurityGroup,
        loggingBucket: s3Stack.loggingBucket,
        publicResourcesBucket: s3Stack.publicResourcesBucket,
        crossAccountBucket: s3Stack.crossAccountBucket,
        emailTemplatesBucket: s3Stack.emailTemplatesBucket,
        reportTemplatesBucket: s3Stack.reportTemplatesBucket,
        releaseLettersBucket: s3Stack.releaseLettersBucket,
      },
    );
    invoiceApiStack.addDependency(appConfigStack);

    const workerStack = new WorkerStack(
      scope,
      `${props.envProps.shortName}-Worker`,
      {
        ...props,
        description: `${props.envProps.shortName} Worker Stack`,
        vpc: vpcStack.vpc,
        cluster: cluster,
        ecrRepository: ecrStack.ecrRepository,
        serviceSecurityGroup: sgStack.fargateSecurityGroup,
        reportsQueueArn: sqsStack.workerJobsQueue.queueArn,
        reportsBucket: s3Stack.reportsBucket,
        emailTemplatesBucket: s3Stack.emailTemplatesBucket,
        reportTemplatesBucket: s3Stack.reportTemplatesBucket,
        workerTaskCpu: props.envProps.workerTaskCpu,
        workerTaskMemory: props.envProps.workerTaskMemory,
        workerContainerCpu: props.envProps.workerContainerCpu,
        workerContainerMemory: props.envProps.workerContainerMemory,
        salesforceReportsBucket: s3Stack.reportsSalesforceBucket,
      },
    );
    workerStack.addDependency(sqsStack);
    workerStack.addDependency(appConfigStack);
    workerStack.addDependency(auroraStack);
    workerStack.addDependency(ecrStack);
    workerStack.addDependency(sgStack);
    workerStack.addDependency(s3Stack);

    const alarmsStack = new CloudWatchAlarmsStack(
      scope,
      `${props.envProps.shortName}-CloudWatchAlarms`,
      {
        ...props,
        description: `${props.envProps.shortName} CloudWatch Alarms Stack`,
        cluster: cluster,
        slackWorkspaceId: props.envProps.slackWorkspaceId,
        slackCICDChannelId: props.envProps.slackCICDChannelId,
      },
    );

    alarmsStack.createServiceAlarms(
      `${props.envProps.shortName}-InvoiceApi`,
      invoiceApiStack.serviceName,
      cluster.clusterName,
      invoiceApiStack.serviceArn,
    );

    alarmsStack.createServiceAlarms(
      `${props.envProps.shortName}-Worker`,
      workerStack.serviceName,
      cluster.clusterName,
      workerStack.serviceArn,
    );

    new DocumentsProcessingStack(
      scope,
      `${props.envProps.shortName}-DocumentsProcessing`,
      {
        ...props,
        description: `${props.envProps.shortName} DocumentsProcessing Stack`,
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
          filestackArn: secretsManagerStack.filestackSecret.secretArn,
          convertapiArn: secretsManagerStack.convertapiSecret.secretArn,
          dbArn: auroraStack.dbSecretARN,
        },
        updateDocsProps: {
          apiUrl: invoiceApiStack.loadBalancerUrl,
        },
        vpc: vpcStack.vpc,
        databaseSecurityGroup: sgStack.auroraSecurityGroup,
      },
    );

    new DispatcherStack(scope, `${props.envProps.shortName}-Dispatcher`, {
      ...props,
      s3Stack: s3Stack,
    });
  }
}
