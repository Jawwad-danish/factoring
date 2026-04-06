import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecurityGroupStack } from '../lib/infrastructure/security-groups.stack';
import { VpcStack } from '../lib/infrastructure/vpc.stack';
import { envProps } from './test.props';

describe('Security Group stack', () => {
  test('Invoice API Service SG', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'BobtailVPC', { envProps });
    const sgStack = new SecurityGroupStack(app, 'SG', {
      vpc: vpcStack.vpc,
      envProps,
    });

    const template = Template.fromStack(sgStack);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: `${envProps.shortName} API Service SG`,
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: `${envProps.shortName} ALB SG`,
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow all 80 IPv4',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
        {
          CidrIpv6: '::/0',
          Description: 'Allow all 80 IPv6',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow all 443 IPv4',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
        {
          CidrIpv6: '::/0',
          Description: 'Allow all 443 IPv6',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
      ],
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: 'Allow service access from ALB',
      FromPort: 3000,
      ToPort: 3000,
    });
  });

  test('Aurora SG', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'BobtailVPC', { envProps });
    const sgStack = new SecurityGroupStack(app, 'SG', {
      vpc: vpcStack.vpc,
      envProps,
    });

    const template = Template.fromStack(sgStack);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: `${envProps.shortName} Aurora SG`,
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: 'Allow DB access from bastion',
      FromPort: 5432,
      ToPort: 5432,
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: 'Allow DB access from service',
      FromPort: 5432,
      ToPort: 5432,
    });
  });

  test('Bastion SG', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'BobtailVPC', { envProps });
    const sgStack = new SecurityGroupStack(app, 'SG', {
      vpc: vpcStack.vpc,
      envProps,
    });

    const template = Template.fromStack(sgStack);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: `${envProps.shortName} Bastion SG`,
    });
  });
});
