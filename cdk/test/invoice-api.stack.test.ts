import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { SecurityGroupStack } from '../lib/infrastructure/security-groups.stack';
import { VpcStack } from '../lib/infrastructure/vpc.stack';
import { InvoiceApiStack } from '../lib/invoice-api/invoice-api.stack';
import { EcrStack } from '../lib/persistent/ecr.stack';
import { S3Stack } from '../lib/persistent/s3.stack';
import { envProps } from './test.props';

describe('Invoice API Stack', () => {
  test('synthesizes the way we expect', () => {
    const app = new cdk.App();
    const emptyStack = new cdk.Stack(app, 'EmptyStack');
    const vpcStack = new VpcStack(app, 'BobtailVPC', {
      envProps,
      env: { region: 'us-east-1' },
    });
    const ecrStack = new EcrStack(app, 'ECR', { env: { region: 'us-east-1' } });
    const sgStack = new SecurityGroupStack(app, 'SG', {
      vpc: vpcStack.vpc,
      envProps,
      env: { region: 'us-east-1' },
    });
    const s3Stack = new S3Stack(app, 'S3', {
      envProps,
      env: { region: 'us-east-1' },
    });

    const cluster = new ecs.Cluster(emptyStack, 'BobtailCluster', {
      vpc: vpcStack.vpc,
      clusterName: `${envProps.shortName}-cluster`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });
    const apiStack = new InvoiceApiStack(app, 'BobtailFargate', {
      vpc: vpcStack.vpc,
      cluster: cluster,
      ecrRepository: ecrStack.ecrRepository,
      serviceSecurityGroup: sgStack.fargateSecurityGroup,
      albSecurityGroup: sgStack.albSecurityGroup,
      loggingBucket: s3Stack.loggingBucket,
      publicResourcesBucket: s3Stack.publicResourcesBucket,
      crossAccountBucket: s3Stack.crossAccountBucket,
      emailTemplatesBucket: s3Stack.emailTemplatesBucket,
      reportTemplatesBucket: s3Stack.reportTemplatesBucket,
      releaseLettersBucket: s3Stack.releaseLettersBucket,
      envProps: envProps,
      env: { region: 'us-east-1' },
    });

    const template = Template.fromStack(apiStack);
    const emptyTemplate = Template.fromStack(emptyStack);

    // Check that the cluster exists in the empty stack
    emptyTemplate.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: `${envProps.shortName}-cluster`,
    });
    emptyTemplate.hasResourceProperties(
      'AWS::ECS::ClusterCapacityProviderAssociations',
      {
        CapacityProviders: ['FARGATE', 'FARGATE_SPOT'],
      },
    );

    template.hasResourceProperties('AWS::IAM::Role', {});
    // Get the ECS Service resource
    const ecsServiceResources = template.findResources('AWS::ECS::Service');
    const ecsServiceLogicalId = Object.keys(ecsServiceResources)[0];
    const ecsServiceResource = ecsServiceResources[ecsServiceLogicalId];

    // Check basic properties
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: `${envProps.shortName}-service`,
      CapacityProviderStrategy: [
        {
          CapacityProvider: 'FARGATE',
          Weight: 1,
        },
        {
          CapacityProvider: 'FARGATE_SPOT',
          Weight: 2,
        },
      ],
      LoadBalancers: [
        {
          ContainerName: `${envProps.shortName}-container`,
          ContainerPort: 3000,
        },
      ],
      NetworkConfiguration: {
        AwsvpcConfiguration: {
          AssignPublicIp: 'DISABLED',
        },
      },
    });

    const clusterRef = ecsServiceResource.Properties.Cluster;
    expect(clusterRef).toBeDefined();
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: `${envProps.shortName}-taskdef`,
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/ecs/invoiceApiService-${envProps.shortName}`,
    });
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Name: `${envProps.shortName}-alb`,
        Type: 'application',
        Scheme: 'internet-facing',
      },
    );
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS',
      Certificates: [
        {
          CertificateArn: envProps.certificateArn,
        },
      ],
    });
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 3000,
      Protocol: 'HTTP',
      HealthCheckPath: '/health',
      HealthCheckIntervalSeconds: 10,
      HealthCheckTimeoutSeconds: 5,
      TargetType: 'ip',
    });
  });
});
