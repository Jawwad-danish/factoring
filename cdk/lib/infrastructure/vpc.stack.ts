import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { EnvProps } from '../cdk.config';

export interface VpcStackProps extends cdk.StackProps {
  envProps: EnvProps;
  loggingBucket?: s3.Bucket;
}

export class VpcStack extends cdk.Stack {
  readonly vpc: ec2.Vpc;

  constructor(scope: cdk.App, id: string, private props: VpcStackProps) {
    super(scope, id, props);

    // Create VPC
    this.vpc = new ec2.Vpc(this, `${props.envProps.shortName}-VPC`, {
      cidr: props.envProps.vpcCidr,
      maxAzs: 2,
      natGateways: props.envProps.natGateways,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      /**
       * Each entry in this list configures a Subnet Group
       *
       * PRIVATE_ISOLATED: Isolated Subnets do not route traffic to the Internet (in this VPC).
       * PRIVATE_WITH_NAT: Subnet that routes to the internet, but not vice versa.
       * PUBLIC: Subnet connected to the Internet.
       */
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${props.envProps.shortName}-db`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: `${props.envProps.shortName}-private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `${props.envProps.shortName}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    if (props.envProps.vpcLogging && props.loggingBucket) {
      new ec2.FlowLog(this, `${props.envProps.shortName}-VpcFlowLog`, {
        resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
        destination: ec2.FlowLogDestination.toS3(
          props.loggingBucket,
          `${props.envProps.shortName}-vpcFlowLog`,
        ),
        flowLogName: `${props.envProps.shortName}-vpcFlowLog`,
      });
    }

    // Output the VPC ID
    new cdk.CfnOutput(this, `${props.envProps.shortName}-VPCId`, {
      value: this.vpc.vpcId,
      description: `${props.envProps.shortName}-VPC ID`,
      exportName: `${props.envProps.shortName}-VpcStack:vpcId`,
    });
  }
}
