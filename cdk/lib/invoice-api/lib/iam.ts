import * as iam from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvProps } from '../../cdk.config';

interface CreateExecRoleProps {
  envProps: EnvProps;
}

interface CreateTaskRoleProps {
  envProps: EnvProps;
  publicResourcesBucket: Bucket;
  crossAccountBucket: Bucket;
  emailTemplatesBucket: Bucket;
  reportTemplatesBucket: Bucket;
  releaseLettersBucket: Bucket;
}

export const createExecRole = (
  scope: Construct,
  props: CreateExecRoleProps,
): iam.Role => {
  // create task definition execution role (permission that fargate service requires to start the task)
  const role = new iam.Role(
    scope,
    `${props.envProps.shortName}-TaskExecutionRole`,
    {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    },
  );
  const policy = iam.ManagedPolicy.fromManagedPolicyArn(
    scope,
    `${props.envProps.shortName}-task-execution-policy`,
    'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
  );
  role.addManagedPolicy(policy);

  return role;
};

// create task role (permissions that the application requires)
export const createTaskRole = (
  scope: Construct,
  props: CreateTaskRoleProps,
): iam.Role => {
  // create custom IAM policy
  const taskPolicy = new iam.PolicyDocument({
    statements: [
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
        ],
        // 👇 Default for `effect` is ALLOW
        effect: iam.Effect.ALLOW,
      }),
      new iam.PolicyStatement({
        resources: ['*'],
        actions: [
          'secretsmanager:GetResourcePolicy',
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
          'secretsmanager:ListSecretVersionIds',
          'secretsmanager:ListSecrets',
        ],
        // 👇 Default for `effect` is ALLOW
        effect: iam.Effect.ALLOW,
      }),
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['cloudwatch:ListMetrics', 'cloudwatch:PutMetricData'],
        // 👇 Default for `effect` is ALLOW
        effect: iam.Effect.ALLOW,
      }),
      new iam.PolicyStatement({
        actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:ListBucket'],
        // 👇 Default for `effect` is ALLOW
        effect: iam.Effect.ALLOW,
        resources: [`${props.publicResourcesBucket.bucketArn}/*`],
      }),
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:GetObjectACL', 's3:ListBucket'],
        // 👇 Default for `effect` is ALLOW
        effect: iam.Effect.ALLOW,
        resources: [`${props.crossAccountBucket.bucketArn}/*`],
      }),
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        // 👇 Default for `effect` is ALLOW
        effect: iam.Effect.ALLOW,
        resources: [`${props.emailTemplatesBucket.bucketArn}/*`],
      }),
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        // 👇 Default for `effect` is ALLOW
        effect: iam.Effect.ALLOW,
        resources: [`${props.reportTemplatesBucket.bucketArn}/*`],
      }),
      new iam.PolicyStatement({
        actions: [
          's3:PutObject',
          's3:PutObjectAcl',
          's3:ListBucket',
          's3:GetObject',
        ],
        // 👇 Default for `effect` is ALLOW
        effect: iam.Effect.ALLOW,
        resources: [
          `${props.reportTemplatesBucket.bucketArn}/*`,
          `${props.releaseLettersBucket.bucketArn}/*`,
        ],
      }),
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['ses:SendRawEmail', 'ses:SendEmail'],
        effect: iam.Effect.ALLOW,
      }),
    ],
  });
  const role = new iam.Role(scope, `${props.envProps.shortName}-TaskRole`, {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    inlinePolicies: {
      TaskPolicy: taskPolicy,
    },
  });
  role.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess'),
  );
  return role;
};
