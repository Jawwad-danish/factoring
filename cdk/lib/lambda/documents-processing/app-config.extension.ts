import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export interface AppConfigLambdaProps {
  application: string;
  environment: string;
  profile: string;
}

/**
 * ARN for layer extension can be found in the documentation
 * https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions-versions.html
 */
export const getAppConfigExtensionLayer = (
  scope: Construct,
  id: string,
): lambda.ILayerVersion => {
  return lambda.LayerVersion.fromLayerVersionArn(
    scope,
    id,
    `arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension:69`,
  );
};

/**
 * The AWS_APPCONFIG_EXTENSION_HTTP_PORT environment variable specifies the port on which the local HTTP server that hosts the extension runs.
 * The default value is 2772.
 *
 * The AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS environment variable controls how often the extension polls AWS AppConfig for an updated configuration in seconds.
 * The default value is 45 seconds.
 *
 * The AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS environment variable controls the maximum amount of time the extension waits before retrieving configurations from the cache in milliseconds.
 * The default value is 3000.
 *
 * For more information please check the documentation and workshop
 * https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html
 * https://mng.workshop.aws/appconfig/lambda-appconfig-integration.html
 */
export const getAppConfigEnvironmentVariables = (
  props: AppConfigLambdaProps,
): { [key: string]: string } => {
  return {
    AWS_APPCONFIG_EXTENSION_HTTP_PORT: '2772',
    AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: '45',
    AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: '3000',
    AWS_APPCONFIG_APPLICATION: props.application,
    AWS_APPCONFIG_ENVIRONMENT: props.environment,
    AWS_APPCONFIG_PROFILE: props.profile,
  };
};

export const buildAppConfigPolicy = (): PolicyStatement => {
  return new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'appconfig:StartConfigurationSession',
      'appconfig:GetLatestConfiguration',
    ],
    resources: [
      `arn:aws:appconfig:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}*`,
    ],
  });
};
