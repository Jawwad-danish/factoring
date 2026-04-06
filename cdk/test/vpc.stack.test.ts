import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/infrastructure/vpc.stack';
import { S3Stack } from '../lib/persistent/s3.stack';
import { envProps } from './test.props';

describe('VPC Stack', () => {
  test('VPC', () => {
    const app = new cdk.App();
    const s3Stack = new S3Stack(app, 'S3', { envProps });
    const stack = new VpcStack(app, 'BobtailVPC', {
      envProps,
      loggingBucket: s3Stack.loggingBucket,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: envProps.vpcCidr,
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });

    template.hasResourceProperties('AWS::EC2::FlowLog', {
      LogDestinationType: 's3',
      ResourceType: 'VPC',
      TrafficType: 'ALL',
    });
  });
});
