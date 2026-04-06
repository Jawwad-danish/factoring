import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BastionStack } from '../lib/infrastructure/bastion.stack';
import { VpcStack } from '../lib/infrastructure/vpc.stack';
import { envProps } from './test.props';
import { SecurityGroupStack } from '../lib/infrastructure/security-groups.stack';

describe('Bastion stack', () => {
  test('Bastion host', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'BobtailVPC', { envProps });
    const sgStack = new SecurityGroupStack(app, 'SG', {
      vpc: vpcStack.vpc,
      envProps,
    });

    const bastionStack = new BastionStack(app, 'BobtailBastion', {
      vpc: vpcStack.vpc,
      envProps,
      securityGroup: sgStack.bastionSecurityGroup,
    });

    const template = Template.fromStack(bastionStack);
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.nano',
      Tags: [{ Key: 'Name', Value: `${envProps.shortName}-bastion-host` }],
    });
  });
});
