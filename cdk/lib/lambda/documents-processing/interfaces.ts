import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import { EnvProps } from '../../cdk.config';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';

export interface AppConfigLambdaProps {
  application: string;
  environment: string;
  profile: string;
}

export interface UploaderLambdaProps {
  s3Bucket: Bucket;
}

export interface ExecutorLambdaProps {
  queue: sqs.Queue;
}
export interface UpdateDocsLambdaProps {
  apiUrl: string;
}
export interface SecretsManagerLambdaProps {
  filestackArn: string;
  convertapiArn: string;
  dbArn: string;
}

export interface DocumentsProcessingProps extends cdk.StackProps {
  uploaderProps: UploaderLambdaProps;
  updateDocsProps: UpdateDocsLambdaProps;
  appConfigProps: AppConfigLambdaProps;
  secretsManagerProps: SecretsManagerLambdaProps;
  executorProps: ExecutorLambdaProps;
  envProps: EnvProps;
  vpc: Vpc;
  databaseSecurityGroup: SecurityGroup;
}
