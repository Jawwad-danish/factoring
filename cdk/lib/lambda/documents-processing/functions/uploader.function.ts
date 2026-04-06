import { Duration } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { EnvProps } from '../../../cdk.config';
import { LambdaPaths } from '../../types';

export const buildUploaderLambda = (
  scope: Construct,
  paths: LambdaPaths,
  bucket: { name: string; arn: string },
  envProps: EnvProps,
) => {
  const lambdaPath = path.resolve(paths.lambdaRoot, 'uploader/handler.ts');

  return new NodejsFunction(scope, `${envProps.shortName}-document-upload`, {
    entry: lambdaPath,
    projectRoot: paths.projectRoot,
    depsLockFilePath: paths.depsLockFile,
    handler: 'handler',
    functionName: `${envProps.shortName}-document-upload`,
    runtime: lambda.Runtime.NODEJS_18_X,
    timeout: Duration.minutes(1),
    memorySize: 512,
    retryAttempts: 0,
    environment: {
      S3_BUCKET: bucket.name,
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
        actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:ListBucket'],
        resources: [bucket.arn, `${bucket.arn}/*`],
      }),
    ],
  });
};
