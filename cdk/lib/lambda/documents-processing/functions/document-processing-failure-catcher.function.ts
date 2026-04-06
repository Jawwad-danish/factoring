import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { UpdateDocsLambdaProps } from '../';
import { EnvProps } from '../../../cdk.config';
import { LambdaPaths } from '../../types';

/**
 * Lambda for handling document processing failure
 */
export const buildDocumentsProcessingFailEventHandlerLambda = (
  scope: Construct,
  paths: LambdaPaths,
  props: UpdateDocsLambdaProps,
  envProps: EnvProps,
): lambda.Function => {
  const lambdaPath = path.resolve(
    paths.lambdaRoot,
    'document-processing-fail-event-handler/handler.ts',
  );

  return new NodejsFunction(
    scope,
    `${envProps.shortName}-document-processing-fail-event-handler`,
    {
      entry: lambdaPath,
      projectRoot: paths.projectRoot,
      depsLockFilePath: paths.depsLockFile,
      handler: 'handler',
      functionName: `${envProps.shortName}-document-processing-fail-event-handler`,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(10),
      bundling: {
        minify: true,
        sourceMap: true,
        sourcesContent: false,
        externalModules: ['axios', 'class-validator', 'class-transformer'],
        nodeModules: ['axios', 'class-validator', 'class-transformer'],
      },
      allowPublicSubnet: false,
      environment: {
        API_URL: props.apiUrl,
        NODE_ENV: envProps.name,
        NODE_OPTIONS: '--enable-source-maps',
      },
    },
  );
};
