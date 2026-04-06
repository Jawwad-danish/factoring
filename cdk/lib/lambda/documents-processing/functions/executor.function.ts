import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import * as path from 'path';
import { LambdaPaths } from '../../types';
import { EnvProps } from '../../../cdk.config';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';

export const buildExecutorLambda = (
  scope: Construct,
  paths: LambdaPaths,
  stepFunction: StateMachine,
  queue: sqs.Queue,
  envProps: EnvProps,
) => {
  const lambdaPath = path.resolve(paths.lambdaRoot, 'executor/handler.ts');

  const executor = new NodejsFunction(
    scope,
    `${envProps.shortName}-executorProxy`,
    {
      entry: lambdaPath,
      projectRoot: paths.projectRoot,
      depsLockFilePath: paths.depsLockFile,
      handler: 'handler',
      functionName: `${envProps.shortName}-documents-processing-proxy`,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
      environment: {
        STEP_FUNCTION_ARN: stepFunction.stateMachineArn,
        NODE_ENV: envProps.name,
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: [
          'cache-manager',
          '@nestjs/microservices',
          '@nestjs/microservices/microservices-module',
          '@nestjs/websockets/socket-module',
        ],
      },
      allowPublicSubnet: false,
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['states:StartExecution'],
          resources: [stepFunction.stateMachineArn],
        }),
      ],
    },
  );

  const eventSource = new lambdaEventSources.SqsEventSource(queue, {
    batchSize: 1,
  });
  executor.addEventSource(eventSource);
};
