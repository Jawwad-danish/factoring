import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';
import { EnvProps } from '../../../cdk.config';
import { LambdaPaths } from '../../types';
import { Duration } from 'aws-cdk-lib';

export const buildDispatcherLambda = (
  scope: Construct,
  paths: LambdaPaths,
  envProps: EnvProps,
  props: {
    s3Bucket: Bucket;
  },
): NodejsFunction => {
  const lambdaPath = path.resolve(paths.lambdaRoot, 'dispatcher/handler.ts');

  const lambdaFunction = new NodejsFunction(
    scope,
    `${envProps.shortName}-dispatcher`,
    {
      entry: lambdaPath,
      projectRoot: paths.projectRoot,
      depsLockFilePath: paths.depsLockFile,
      handler: 'handler',
      functionName: `${envProps.shortName}-cross-account-item-dispatcher`,
      runtime: lambda.Runtime.NODEJS_18_X,
      retryAttempts: 0,
      timeout: Duration.seconds(90),
      environment: {
        API_URL: envProps.albDomainAlias,
        NODE_ENV: envProps.shortName,
      },
      bundling: {
        minify: true,
        externalModules: [
          'cache-manager',
          '@nestjs/microservices',
          '@nestjs/microservices/microservices-module',
          '@nestjs/websockets/socket-module',
        ],
      },
      allowPublicSubnet: false,
    },
  );

  const eventSource = new lambdaEventSources.S3EventSource(props.s3Bucket, {
    events: [EventType.OBJECT_CREATED],
  });
  lambdaFunction.addEventSource(eventSource);

  return lambdaFunction;
};
