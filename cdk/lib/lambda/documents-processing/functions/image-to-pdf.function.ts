import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { LambdaPaths } from '../../types';
import { EnvProps } from '../../../cdk.config';
import {
  AppConfigLambdaProps,
  buildAppConfigPolicy,
  getAppConfigEnvironmentVariables,
  getAppConfigExtensionLayer,
} from '../app-config.extension';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

/**
 * The AWS AppConfig Lambda extension does not support all runtimes.
 *
 * For all the supported runtimes please check the documentation
 * https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html#appconfig-integratio-lambda-extensions-runtimes
 */
export const buildImageToPdfLambda = (
  scope: Construct,
  paths: LambdaPaths,
  appConfigLambdaProps: AppConfigLambdaProps,
  filestackSecretsManagerArn: string,
  envProps: EnvProps,
): lambda.Function => {
  const lambdaPath = path.resolve(paths.lambdaRoot, 'image-to-pdf/handler.ts');

  return new NodejsFunction(scope, `${envProps.shortName}-image-to-pdf`, {
    entry: lambdaPath,
    projectRoot: paths.projectRoot,
    depsLockFilePath: paths.depsLockFile,
    handler: 'handler',
    functionName: `${envProps.shortName}-image-to-pdf`,
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
      ],
    },
    allowPublicSubnet: false,
    initialPolicy: [
      buildAppConfigPolicy(),
      buildFilestackSecretsManagerPolicy(filestackSecretsManagerArn),
    ],
    environment: {
      ...getAppConfigEnvironmentVariables(appConfigLambdaProps),
      NODE_ENV: envProps.name,
      NODE_OPTIONS: '--enable-source-maps',
    },
    layers: [
      getAppConfigExtensionLayer(scope, 'image-to-pdf-app-config-layer'),
    ],
  });
};

const buildFilestackSecretsManagerPolicy = (
  filestackSecretsManagerArn: string,
): PolicyStatement => {
  return new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
    resources: [`${filestackSecretsManagerArn}*`],
  });
};
