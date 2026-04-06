import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Duration, StackProps } from 'aws-cdk-lib';
import { EnvProps } from '../cdk.config';

export interface BastionProps extends StackProps {
  vpc: ec2.Vpc;
  envProps: EnvProps;
  securityGroup: ec2.ISecurityGroup;
}

export class BastionStack extends cdk.Stack {
  readonly bastion: ec2.BastionHostLinux;
  constructor(scope: cdk.App, id: string, props: BastionProps) {
    super(scope, id, props);

    this.bastion = new ec2.BastionHostLinux(
      this,
      `${props.envProps.shortName}-Bastion`,
      {
        vpc: props.vpc,
        instanceName: `${props.envProps.shortName}-bastion-host`,
        securityGroup: props.securityGroup,
        subnetSelection: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        // make sure we update ssm agent to latest to enable tunneling to RDS
        init: ec2.CloudFormationInit.fromElements(
          ec2.InitCommand.shellCommand('sudo yum update -y amazon-ssm-agent'),
        ),
        initOptions: {
          timeout: Duration.minutes(15),
        },
      },
    );
  }
}
