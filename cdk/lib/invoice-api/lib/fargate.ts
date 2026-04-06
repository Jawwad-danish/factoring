import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';
import { EnvProps } from '../../cdk.config';

export const createLogging = (
  scope: Construct,
  envProps: EnvProps,
): ecs.AwsLogDriver => {
  const invoiceApiServiceLogGroup = new logs.LogGroup(
    scope,
    `${envProps.shortName}-invoiceApiServiceLogGroup`,
    {
      logGroupName: `/ecs/invoiceApiService-${envProps.shortName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    },
  );

  const invoiceApiServiceLogDriver = new ecs.AwsLogDriver({
    logGroup: invoiceApiServiceLogGroup,
    streamPrefix: 'InvoiceApiService',
  });
  return invoiceApiServiceLogDriver;
};

export const createLbService = (
  scope: Construct,
  props: {
    envProps: EnvProps;
    vpc: ec2.Vpc;
    cluster: ecs.Cluster;
    serviceSecurityGroup: ec2.SecurityGroup;
    albSecurityGroup: ec2.SecurityGroup;
    ecrRepository: ecr.IRepository;
    executionRole: iam.Role;
    taskRole: iam.Role;
    logging: ecs.AwsLogDriver;
    loggingBucket?: s3.Bucket;
  },
): {
  alb: elbv2.ApplicationLoadBalancer;
  albProtocol: string;
  service: ecs.FargateService;
} => {
  // Create Task Definition
  const taskDefinition = new ecs.FargateTaskDefinition(
    scope,
    `${props.envProps.shortName}-TaskDef`,
    {
      taskRole: props.taskRole,
      executionRole: props.executionRole,
      family: `${props.envProps.shortName}-taskdef`,
      cpu: props.envProps.taskCpu,
      memoryLimitMiB: props.envProps.taskMemory,
    },
  );

  // Add container
  const container = taskDefinition.addContainer(
    `${props.envProps.shortName}-container`,
    {
      image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository),
      memoryLimitMiB: props.envProps.containerMemory,
      cpu: props.envProps.containerCpu,
      containerName: `${props.envProps.shortName}-container`,
      logging: props.logging,
      environment: {
        NODE_ENV: props.envProps.name,
      },
    },
  );

  container.addPortMappings({
    containerPort: 3000,
    protocol: ecs.Protocol.TCP,
  });

  // Create Service
  const capacityProviderStrategies = props.envProps.capacityProviders.map(
    (value, index) => {
      return {
        capacityProvider: value,
        weight: index + 1,
      };
    },
  );
  if (capacityProviderStrategies.length === 0) {
    throw new Error(
      'You must specify at least on of the valid capacity proviers: FARGATE or FARGATE_SPOT',
    );
  }
  const invoiceApiService = new ecs.FargateService(
    scope,
    `${props.envProps.shortName}-Service`,
    {
      serviceName: `${props.envProps.shortName}-service`,
      cluster: props.cluster,
      taskDefinition,
      securityGroups: [props.serviceSecurityGroup],
      assignPublicIp: false,
      capacityProviderStrategies,
      circuitBreaker: {
        rollback: true,
      },
      enableECSManagedTags: true,
    },
  );

  const scalableTarget = invoiceApiService.autoScaleTaskCount({
    minCapacity: props.envProps.minContainerCapacity,
    maxCapacity: props.envProps.maxContainerCapacity,
  });

  scalableTarget.scaleOnCpuUtilization(
    `${props.envProps.shortName}-AutoScalingCPU`,
    {
      targetUtilizationPercent: 60,
      scaleInCooldown: cdk.Duration.seconds(5),
      scaleOutCooldown: cdk.Duration.seconds(5),
    },
  );

  scalableTarget.scaleOnMemoryUtilization(
    `${props.envProps.shortName}-AutoScalingMemory`,
    {
      targetUtilizationPercent: 80,
    },
  );

  // Create ALB
  const alb = new elbv2.ApplicationLoadBalancer(
    scope,
    `${props.envProps.shortName}-ALB`,
    {
      vpc: props.vpc,
      securityGroup: props.albSecurityGroup,
      internetFacing: true,
      loadBalancerName: `${props.envProps.shortName}-alb`,
      deletionProtection: true,
    },
  );

  const starBobtailComCert = certificatemanager.Certificate.fromCertificateArn(
    scope,
    `${props.envProps.shortName}-starbobtail.com`,
    props.envProps.certificateArn,
  );

  let albProtocol = elbv2.ApplicationProtocol.HTTP;
  let listenerProps;

  listenerProps = {
    port: 80,
    open: true,
  };

  if (starBobtailComCert) {
    albProtocol = elbv2.ApplicationProtocol.HTTPS;
    alb.addRedirect({
      sourcePort: 80,
      targetPort: 443,
      sourceProtocol: elbv2.ApplicationProtocol.HTTP,
      targetProtocol: elbv2.ApplicationProtocol.HTTPS,
    });
    listenerProps = {
      port: 443,
      open: true,
      certificates: [starBobtailComCert],
    };
  }

  const listener = alb.addListener(
    `${props.envProps.shortName}-PublicListener`,
    listenerProps,
  );

  // Attach ALB to ECS Service
  listener.addTargets(`${props.envProps.shortName}-ECS`, {
    port: 3000,
    protocol: elbv2.ApplicationProtocol.HTTP, // this is between ALB and Service
    targets: [invoiceApiService],
    // include health check (default is none)
    healthCheck: {
      path: '/health',
      interval: cdk.Duration.seconds(10),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 5,
      unhealthyThresholdCount: 2,
    },
    deregistrationDelay: cdk.Duration.minutes(1),
  });

  if (props.envProps.albLogging && props.loggingBucket) {
    alb.logAccessLogs(props.loggingBucket, `${props.envProps.shortName}-alb`);
  }

  const wafAclAppSyncArn = cdk.Fn.importValue('WAF:wafAclRegionalArn');
  new wafv2.CfnWebACLAssociation(scope, `${props.envProps.shortName}-AlbWaf`, {
    resourceArn: alb.loadBalancerArn,
    webAclArn: wafAclAppSyncArn,
  });

  return { alb, albProtocol, service: invoiceApiService };
};
