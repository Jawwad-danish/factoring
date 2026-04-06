import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { EnvProps } from '../cdk.config';
import {
  createExecRole,
  createTaskRole,
  createLbService,
  createLogging,
} from '.';

export interface InvoiceApiProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  cluster: Cluster;
  ecrRepository: ecr.IRepository;
  serviceSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  loggingBucket?: s3.Bucket;
  publicResourcesBucket: s3.Bucket;
  envProps: EnvProps;
  crossAccountBucket: s3.Bucket;
  emailTemplatesBucket: s3.Bucket;
  reportTemplatesBucket: s3.Bucket;
  releaseLettersBucket: s3.Bucket;
}

export class InvoiceApiStack extends cdk.Stack {
  readonly cluster: Cluster;
  readonly securityGroup: ec2.SecurityGroup;
  readonly loadBalancerUrl: string;
  readonly serviceName: string;
  readonly serviceArn: string;

  constructor(scope: cdk.App, id: string, private props: InvoiceApiProps) {
    super(scope, id, props);

    const executionRole = createExecRole(this, {
      envProps: props.envProps,
    });
    const taskRole = createTaskRole(this, {
      envProps: props.envProps,
      publicResourcesBucket: props.publicResourcesBucket,
      crossAccountBucket: props.crossAccountBucket,
      emailTemplatesBucket: props.emailTemplatesBucket,
      reportTemplatesBucket: props.reportTemplatesBucket,
      releaseLettersBucket: props.releaseLettersBucket,
    });

    const logging = createLogging(this, props.envProps);
    const { alb, albProtocol, service } = createLbService(this, {
      envProps: props.envProps,
      cluster: props.cluster,
      vpc: props.vpc,
      serviceSecurityGroup: props.serviceSecurityGroup,
      albSecurityGroup: props.albSecurityGroup,
      ecrRepository: props.ecrRepository,
      executionRole,
      taskRole,
      logging,
      loggingBucket: props.loggingBucket,
    });

    this.serviceName = service.serviceName;
    this.serviceArn = service.serviceArn;

    this.loadBalancerUrl = props.envProps.albDomainAlias
      ? props.envProps.albDomainAlias
          .toLowerCase()
          .startsWith(albProtocol.toLowerCase())
        ? props.envProps.albDomainAlias
        : `${albProtocol}://${props.envProps.albDomainAlias}`
      : `${albProtocol}://${alb.loadBalancerDnsName}`;
  }
}
