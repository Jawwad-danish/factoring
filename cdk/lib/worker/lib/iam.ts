import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvProps } from '../../cdk.config';

export const createWorkerExecRole = (
  scope: Construct,
  envProps: EnvProps,
): iam.Role => {
  const role = new iam.Role(scope, `${envProps.shortName}-WorkerExecRole`, {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });
  const policy = iam.ManagedPolicy.fromManagedPolicyArn(
    scope,
    `${envProps.shortName}-worker-task-execution-policy`,
    'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
  );
  role.addManagedPolicy(policy);
  return role;
};

interface CreateWorkerTaskRoleProps {
  envProps: EnvProps;
  reportsQueueArn: string;
  reportsBucketArn: string;
  emailTemplatesBucketArn: string;
  reportTemplatesBucketArn: string;
  salesforceReportsBucketArn: string;
}

export const createWorkerTaskRole = (
  scope: Construct,
  props: CreateWorkerTaskRoleProps,
): iam.Role => {
  const stackName = `${props.envProps.shortName}-WorkerTaskRole`;
  const taskRole = new iam.Role(scope, stackName, {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      resources: ['*'],
      actions: [
        'appconfig:GetEnvironment',
        'appconfig:GetHostedConfigurationVersion',
        'appconfig:GetConfiguration',
        'appconfig:GetApplication',
        'appconfig:GetConfigurationProfile',
        'appconfig:StartConfigurationSession',
        'appconfig:GetLatestConfiguration',
        'appconfig:ListEnvironments',
      ],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: [
        'secretsmanager:GetResourcePolicy',
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret',
        'secretsmanager:ListSecretVersionIds',
        'secretsmanager:ListSecrets',
      ],
      resources: ['*'],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: [
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
      ],
      resources: [props.reportsQueueArn],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [`${props.reportsBucketArn}/*`],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [props.reportsBucketArn],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [props.emailTemplatesBucketArn],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${props.emailTemplatesBucketArn}/*`],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [props.reportTemplatesBucketArn],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${props.reportTemplatesBucketArn}/*`],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [`${props.salesforceReportsBucketArn}/*`],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [props.salesforceReportsBucketArn],
      effect: iam.Effect.ALLOW,
    }),
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      resources: ['*'],
      actions: ['ses:SendRawEmail', 'ses:SendEmail'],
      effect: iam.Effect.ALLOW,
    }),
  );

  return taskRole;
};
