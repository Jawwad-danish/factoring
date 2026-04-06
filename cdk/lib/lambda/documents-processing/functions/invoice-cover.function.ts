import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { LambdaPaths } from '../../types';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  buildAppConfigPolicy,
  getAppConfigEnvironmentVariables,
  getAppConfigExtensionLayer,
} from '../app-config.extension';
import { AppConfigLambdaProps } from '../';
import { EnvProps } from '../../../cdk.config';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';

/**
 * The AWS AppConfig Lambda extension does not support all runtimes.
 *
 * For all the supported runtimes please check the documentation
 * https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html#appconfig-integratio-lambda-extensions-runtimes
 */
export const buildInvoiceCoverLambda = (
  scope: Construct,
  paths: LambdaPaths,
  appConfigLambdaProps: AppConfigLambdaProps,
  convertapiSecretsManagerArn: string,
  dbSecretArn: string,
  bucket: Bucket,
  envProps: EnvProps,
  vpc: Vpc,
  databaseSecurityGroup: SecurityGroup,
): lambda.Function => {
  const lambdaPath = path.resolve(paths.lambdaRoot, 'invoice-cover/handler.ts');

  const lambdaSg = new SecurityGroup(scope, 'lambda-sg', {
    description: 'SG for lambda',
    vpc: vpc,
    allowAllOutbound: true,
  });
  lambdaSg.connections.allowTo(
    databaseSecurityGroup,
    Port.tcp(5432),
    'Allow db access from lambda update docs url',
  );

  return new NodejsFunction(scope, `${envProps.shortName}-invoice-cover`, {
    entry: lambdaPath,
    vpc: vpc,
    securityGroups: [lambdaSg],
    projectRoot: paths.projectRoot,
    depsLockFilePath: paths.depsLockFile,
    handler: 'handler',
    functionName: `${envProps.shortName}-invoice-cover`,
    runtime: lambda.Runtime.NODEJS_18_X,
    timeout: Duration.minutes(1),
    memorySize: 512,
    bundling: {
      minify: true,
      sourceMap: true,
      externalModules: [
        'canvas',
        'cache-manager',
        '@nestjs/microservices',
        '@nestjs/microservices/microservices-module',
        '@nestjs/websockets/socket-module',
        'pg-native',
      ],
    },
    allowPublicSubnet: false,
    initialPolicy: [
      buildAppConfigPolicy(),
      buildConvertapiKeySecretsManagerPolicy(convertapiSecretsManagerArn),
      buildS3BucketPolicy(bucket),
      buildDBSecretsManagerPolicy(dbSecretArn),
    ],
    environment: {
      ...getAppConfigEnvironmentVariables(appConfigLambdaProps),
      S3_BUCKET: bucket.bucketName,
      NODE_ENV: envProps.name,
      NODE_OPTIONS: '--enable-source-maps',
    },
    layers: [
      getAppConfigExtensionLayer(
        scope,
        `${envProps.shortName}-invoice-cover-appconfig-layer`,
      ),
    ],
  });
};
const buildDBSecretsManagerPolicy = (dbSecretArn: string): PolicyStatement => {
  return new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
    resources: [`${dbSecretArn}*`],
  });
};
const buildConvertapiKeySecretsManagerPolicy = (
  convertapiSecretsManagerArn: string,
): PolicyStatement => {
  return new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
    resources: [`${convertapiSecretsManagerArn}*`],
  });
};

const buildS3BucketPolicy = (bucket: Bucket): PolicyStatement => {
  return new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:ListBucket'],
    resources: [`${bucket.bucketArn}/*`],
  });
};
