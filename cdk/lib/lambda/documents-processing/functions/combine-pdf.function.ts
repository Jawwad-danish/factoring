import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { LambdaPaths } from '../../types';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { AppConfigLambdaProps } from '../interfaces';
import {
  buildAppConfigPolicy,
  getAppConfigEnvironmentVariables,
  getAppConfigExtensionLayer,
} from '../app-config.extension';
import { EnvProps } from '../../../cdk.config';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

/**
 * The AWS AppConfig Lambda extension does not support all runtimes.
 *
 * For all the supported runtimes please check the documentation
 * https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html#appconfig-integratio-lambda-extensions-runtimes
 */
export const buildCombinePdfLambda = (
  scope: Construct,
  paths: LambdaPaths,
  appConfigLambdaProps: AppConfigLambdaProps,
  convertapiSecretsManagerArn: string,
  bucket: Bucket,
  envProps: EnvProps,
): lambda.Function => {
  const lambdaPath = path.resolve(paths.lambdaRoot, 'combine-pdf/handler.ts');

  return new NodejsFunction(scope, `${envProps.shortName}-combine-pdf`, {
    entry: lambdaPath,
    projectRoot: paths.projectRoot,
    depsLockFilePath: paths.depsLockFile,
    handler: 'handler',
    functionName: `${envProps.shortName}-combine-pdf`,
    runtime: lambda.Runtime.NODEJS_18_X,
    timeout: Duration.seconds(30),
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
      ],
    },
    allowPublicSubnet: false,
    initialPolicy: [
      buildAppConfigPolicy(),
      buildConvertapiKeySecretsManagerPolicy(convertapiSecretsManagerArn),
      buildS3BucketPolicy(bucket),
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
        `${envProps.shortName}-combine-pdf-appconfig-ext`,
      ),
    ],
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
