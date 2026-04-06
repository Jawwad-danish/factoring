import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { EnvProps } from '../cdk.config';
import { createWorkerExecRole, createWorkerTaskRole } from './lib/iam';

export interface WorkerStackProps extends cdk.StackProps {
  envProps: EnvProps;
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
  ecrRepository: ecr.IRepository;
  serviceSecurityGroup: ec2.ISecurityGroup;
  //SQS
  reportsQueueArn: string;
  //S3
  reportsBucket: s3.IBucket;
  emailTemplatesBucket: s3.IBucket;
  reportTemplatesBucket: s3.IBucket;
  salesforceReportsBucket: s3.IBucket;
  // Worker specific resources
  workerTaskCpu: number;
  workerTaskMemory: number;
  workerContainerCpu: number;
  workerContainerMemory: number;
}

export class WorkerStack extends cdk.Stack {
  readonly serviceName: string;
  readonly serviceArn: string;

  constructor(scope: cdk.App, id: string, props: WorkerStackProps) {
    super(scope, id, props);

    const envName = props.envProps.shortName;
    const stackName = `${envName}-Worker`;

    const executionRole = createWorkerExecRole(this, props.envProps);
    props.ecrRepository.grantPull(executionRole);

    const taskRole = createWorkerTaskRole(this, {
      envProps: props.envProps,
      reportsQueueArn: props.reportsQueueArn,
      reportsBucketArn: props.reportsBucket.bucketArn,
      emailTemplatesBucketArn: props.emailTemplatesBucket.bucketArn,
      reportTemplatesBucketArn: props.reportTemplatesBucket.bucketArn,
      salesforceReportsBucketArn: props.salesforceReportsBucket.bucketArn,
    });

    const logGroup = new logs.LogGroup(this, `${stackName}-LogGroup`, {
      logGroupName: `/ecs/${stackName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const logging = new ecs.AwsLogDriver({
      logGroup,
      streamPrefix: 'worker',
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${stackName}-TaskDef`,
      {
        family: `${envName}-worker-taskdef`,
        executionRole: executionRole,
        taskRole: taskRole,
        cpu: props.workerTaskCpu,
        memoryLimitMiB: props.workerTaskMemory,
      },
    );

    taskDefinition.addContainer(`${envName}-worker-container`, {
      image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository),
      logging: logging,
      environment: {
        NODE_ENV: props.envProps.name,
      },
      cpu: props.workerContainerCpu,
      memoryLimitMiB: props.workerContainerMemory,
    });

    const service = new ecs.FargateService(this, `${stackName}-Service`, {
      cluster: props.cluster,
      taskDefinition: taskDefinition,
      serviceName: `${envName}-worker-service`,
      desiredCount: 1,
      securityGroups: [props.serviceSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      enableExecuteCommand: true,
    });
    this.serviceName = service.serviceName;
    this.serviceArn = service.serviceArn;
  }
}
