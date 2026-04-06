import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { LambdaPaths } from '../../types';
import {
  AppConfigLambdaProps,
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
export const buildCompressOrientLambda = (
  scope: Construct,
  paths: LambdaPaths,
  appConfigLambdaProps: AppConfigLambdaProps,
  convertapiArn: string,
  envProps: EnvProps,
): lambda.Function => {
  const lambdaPath = path.resolve(
    paths.lambdaRoot,
    'compress-orient/handler.ts',
  );

  return new NodejsFunction(scope, `${envProps.shortName}-compress-orient`, {
    entry: lambdaPath,
    projectRoot: paths.projectRoot,
    depsLockFilePath: paths.depsLockFile,
    handler: 'handler',
    functionName: `${envProps.shortName}-compress-orient`,
    runtime: lambda.Runtime.NODEJS_18_X,
    timeout: Duration.minutes(1),
    memorySize: 512,
    bundling: {
      sourceMap: true,
      externalModules: [
        'canvas',
        'cache-manager',
        '@nestjs/microservices',
        '@nestjs/microservices/microservices-module',
        '@nestjs/websockets/socket-module',
      ],
      nodeModules: ['pdfjs-dist'],
    },
    allowPublicSubnet: false,
    initialPolicy: [
      buildAppConfigPolicy(),
      buildSecretsManagerPolicy(convertapiArn),
    ],
    environment: {
      ...getAppConfigEnvironmentVariables(appConfigLambdaProps),
      NODE_ENV: envProps.name,
      NODE_OPTIONS: '--enable-source-maps',
    },
    layers: [
      getAppConfigExtensionLayer(
        scope,
        `${envProps.shortName}-compress-orient-app-config-layer`,
      ),
    ],
  });
};

const buildSecretsManagerPolicy = (
  convertapiSecretsManagerArn: string,
): PolicyStatement => {
  return new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
    resources: [`${convertapiSecretsManagerArn}*`],
  });
};
