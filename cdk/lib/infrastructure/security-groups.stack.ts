import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvProps } from '../cdk.config';

export interface SecurityGroupProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  envProps: EnvProps;
}

export class SecurityGroupStack extends cdk.Stack {
  readonly albSecurityGroup: ec2.SecurityGroup;
  readonly fargateSecurityGroup: ec2.SecurityGroup;
  readonly bastionSecurityGroup: ec2.ISecurityGroup;
  readonly auroraSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, private props: SecurityGroupProps) {
    super(scope, id, props);

    this.albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${this.props.envProps.shortName}-AlbSecurityGroup`,
      {
        vpc: props.vpc,
        // we don't set securityGroupName because is not recommended and
        // it might prevent updating stacks that depends on it in the future
        // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SecurityGroupProps.html#securitygroupname
        // securityGroupName: 'alb-sg',
        description: `${this.props.envProps.shortName} ALB SG`,
      },
    );

    // allow 80 and 443 on IPv4 and IPv6
    for (const port of [80, 443]) {
      this.albSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(port),
        `Allow all ${port} IPv4`,
      );

      this.albSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv6(),
        ec2.Port.tcp(port),
        `Allow all ${port} IPv6`,
      );
    }

    this.fargateSecurityGroup = new ec2.SecurityGroup(
      this,
      `${this.props.envProps.shortName}-ServiceSecurityGroup`,
      {
        vpc: props.vpc,
        // securityGroupName: 'service-sg',
        description: `${this.props.envProps.shortName} API Service SG`,
      },
    );

    this.fargateSecurityGroup.connections.allowTo(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow service access from ALB',
    );

    this.bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      `${this.props.envProps.shortName}-BastionSecurityGroup`,
      {
        vpc: props.vpc,
        // securityGroupName: 'bastion-sg',
        description: `${this.props.envProps.shortName} Bastion SG`,
      },
    );

    this.auroraSecurityGroup = new ec2.SecurityGroup(
      this,
      `${this.props.envProps.shortName}-AuroraSecurityGroup`,
      {
        vpc: props.vpc,
        // securityGroupName: 'aurora-sg',
        allowAllOutbound: false,
        description: `${this.props.envProps.shortName} Aurora SG`,
      },
    );

    this.auroraSecurityGroup.connections.allowFrom(
      this.bastionSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow DB access from bastion',
    );

    this.auroraSecurityGroup.connections.allowFrom(
      this.fargateSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow DB access from service',
    );
  }
}
