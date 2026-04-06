import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { S3Stack } from '../lib/persistent/s3.stack';
import { envProps } from './test.props';

describe('S3 stack', () => {
  test('invoice documents bucket', () => {
    const app = new cdk.App();
    const s3Stack = new S3Stack(app, 'BobtailS3', { envProps });

    const template = Template.fromStack(s3Stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: `${envProps.shortName}-bobtail-invoice-documents`,
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: `${envProps.shortName}-bobtail-infra-logs`,
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {});
  });
});
