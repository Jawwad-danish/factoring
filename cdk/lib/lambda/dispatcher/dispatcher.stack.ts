import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { EnvProps } from '../../cdk.config';
import { getPaths } from '../paths';
import { buildDispatcherLambda } from './functions';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { S3Stack } from '../../persistent/s3.stack';

export interface DispatcherStackProps extends cdk.StackProps {
  s3Stack: S3Stack;
  envProps: EnvProps;
}

export class DispatcherStack extends cdk.Stack {
  readonly dispatcherLambda: NodejsFunction;
  constructor(scope: cdk.App, id: string, props: DispatcherStackProps) {
    super(scope, id, props);

    const paths = getPaths();
    this.dispatcherLambda = buildDispatcherLambda(this, paths, props.envProps, {
      s3Bucket: props.s3Stack.crossAccountBucket,
    });

    const s3ReadObjectPolicy = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:GetObjectACL',
        's3:ListBucket',
        's3:DeleteObject',
      ],
      principals: [this.dispatcherLambda.grantPrincipal],
      effect: iam.Effect.ALLOW,
      resources: [
        `${props.s3Stack.crossAccountBucket.bucketArn}/*`,
        props.s3Stack.crossAccountBucket.bucketArn,
      ],
    });

    props.s3Stack.crossAccountBucket.addToResourcePolicy(s3ReadObjectPolicy);
  }
}
