import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as chatbot from 'aws-cdk-lib/aws-chatbot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { EnvProps } from '../cdk.config';

export interface CloudWatchAlarmsStackProps extends cdk.StackProps {
  envProps: EnvProps;
  cluster: ecs.ICluster;
  slackWorkspaceId: string;
  slackCICDChannelId: string;
}

export class CloudWatchAlarmsStack extends cdk.Stack {
  public readonly alarmTopic: sns.Topic;
  private readonly props: CloudWatchAlarmsStackProps;

  constructor(scope: Construct, id: string, props: CloudWatchAlarmsStackProps) {
    super(scope, id, props);
    this.props = props;

    this.alarmTopic = new sns.Topic(
      this,
      `${props.envProps.shortName}-AlarmTopic`,
      {
        displayName: `${props.envProps.shortName} ECS Alarms`,
        topicName: `${props.envProps.shortName}-ecs-alarms`,
      },
    );

    // staging and development are on the same account, so we only need to create the Slack channel configuration once
    const shouldCreateSlackChannelConfiguration =
      props.envProps.name === 'development' ||
      props.envProps.name === 'production';

    if (shouldCreateSlackChannelConfiguration) {
      if (!props.slackWorkspaceId || !props.slackCICDChannelId) {
        throw new Error(
          'Slack workspace ID and channel ID required for development and production environments',
        );
      }

      const slackChannel = new chatbot.SlackChannelConfiguration(
        this,
        `${props.envProps.shortName}-SlackChannel`,
        {
          slackChannelConfigurationName: `${props.envProps.shortName}-ecs-alarms`,
          slackWorkspaceId: props.slackWorkspaceId,
          slackChannelId: props.slackCICDChannelId,
          notificationTopics: [this.alarmTopic],
          loggingLevel: chatbot.LoggingLevel.ERROR,
        },
      );

      slackChannel.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'cloudwatch:Describe*',
            'cloudwatch:Get*',
            'cloudwatch:List*',
          ],
          resources: ['*'],
        }),
      );
    }
  }

  /**
   * Creates CloudWatch alarms for an ECS service.
   *
   * IMPORTANT: This method depends on Container Insights being enabled on the ECS cluster.
   * The cluster is configured with `containerInsights: true` in cdk.stack.ts.
   * Task count metrics (DesiredTaskCount, RunningTaskCount) require the ECS/ContainerInsights namespace.
   * If Container Insights is disabled, task-related alarms will fail silently.
   */
  public createServiceAlarms(
    serviceName: string,
    ecsServiceName: string,
    clusterName: string,
    serviceArn: string,
  ): void {
    this.createMemoryAlarm(serviceName, ecsServiceName, clusterName);
    this.createCpuAlarm(serviceName, ecsServiceName, clusterName);
    this.createTaskDegradationAlarms(serviceName, ecsServiceName, clusterName);
    this.createDeploymentFailureEvents(serviceName, serviceArn);
  }

  private createDeploymentFailureEvents(
    serviceName: string,
    serviceArn: string,
  ): void {
    // Rule for ECS Deployment State Changes (e.g., Rollbacks and Failures)
    const deploymentStateRule = new events.Rule(
      this,
      `${serviceName}-DeploymentStateRule`,
      {
        ruleName: `${serviceName}-DeploymentStateEvents`,
        description: `Capture ECS deployment failures for ${serviceName}`,
        eventPattern: {
          source: ['aws.ecs'],
          detailType: ['ECS Deployment State Change'],
          detail: {
            eventName: ['SERVICE_DEPLOYMENT_FAILED'],
          },
          resources: [serviceArn],
        },
      },
    );

    // Rule for ECS Service Actions (e.g., failing to start tasks due to missing secrets/errors)
    const serviceActionRule = new events.Rule(
      this,
      `${serviceName}-ServiceActionRule`,
      {
        ruleName: `${serviceName}-ServiceActionEvents`,
        description: `Capture ECS service action warnings and errors for ${serviceName}`,
        eventPattern: {
          source: ['aws.ecs'],
          detailType: ['ECS Service Action'],
          detail: {
            eventType: ['ERROR', 'WARN'],
          },
          resources: [serviceArn],
        },
      },
    );

    deploymentStateRule.addTarget(new targets.SnsTopic(this.alarmTopic));
    serviceActionRule.addTarget(new targets.SnsTopic(this.alarmTopic));
  }

  private createMemoryAlarm(
    serviceName: string,
    ecsServiceName: string,
    clusterName: string,
  ): void {
    const memoryAlarm = new cloudwatch.Alarm(
      this,
      `${serviceName}-MemoryAlarm`,
      {
        alarmName: `${serviceName}-HighMemoryUsage`,
        alarmDescription: `Memory usage above ${this.props.envProps.alarmMemoryThreshold}% for ${serviceName}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'MemoryUtilization',
          dimensionsMap: {
            ServiceName: ecsServiceName,
            ClusterName: clusterName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: this.props.envProps.alarmMemoryThreshold,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      },
    );

    memoryAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic),
    );
  }

  private createCpuAlarm(
    serviceName: string,
    ecsServiceName: string,
    clusterName: string,
  ): void {
    const cpuAlarm = new cloudwatch.Alarm(this, `${serviceName}-CpuAlarm`, {
      alarmName: `${serviceName}-HighCpuUsage`,
      alarmDescription: `CPU usage above ${this.props.envProps.alarmCpuThreshold}% for ${serviceName}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          ServiceName: ecsServiceName,
          ClusterName: clusterName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: this.props.envProps.alarmCpuThreshold,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
  }

  private createTaskDegradationAlarms(
    serviceName: string,
    ecsServiceName: string,
    clusterName: string,
  ): void {
    const completeOutageAlarm = new cloudwatch.Alarm(
      this,
      `${serviceName}-CompleteOutageAlarm`,
      {
        alarmName: `${serviceName}-CompleteOutage`,
        alarmDescription: `CRITICAL: All tasks stopped for ${serviceName} - complete service outage detected immediately`,
        metric: new cloudwatch.MathExpression({
          expression: 'IF(desired > 0 AND running == 0, 1, 0)',
          usingMetrics: {
            desired: new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'DesiredTaskCount',
              dimensionsMap: {
                ServiceName: ecsServiceName,
                ClusterName: clusterName,
              },
              statistic: 'Maximum',
              period: cdk.Duration.minutes(1),
            }),
            running: new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'RunningTaskCount',
              dimensionsMap: {
                ServiceName: ecsServiceName,
                ClusterName: clusterName,
              },
              statistic: 'Minimum',
              period: cdk.Duration.minutes(1),
            }),
          },
          period: cdk.Duration.minutes(1),
        }),
        threshold: 0,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        actionsEnabled: true,
      },
    );

    completeOutageAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic),
    );

    const taskCountMismatchAlarm = new cloudwatch.Alarm(
      this,
      `${serviceName}-TaskCountMismatchAlarm`,
      {
        alarmName: `${serviceName}-TaskCountMismatch`,
        alarmDescription: `Running tasks below desired count for ${serviceName}`,
        metric: new cloudwatch.MathExpression({
          expression: 'IF(desired > 0 AND running < desired, 1, 0)',
          usingMetrics: {
            desired: new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'DesiredTaskCount',
              dimensionsMap: {
                ServiceName: ecsServiceName,
                ClusterName: clusterName,
              },
              statistic: 'Maximum',
              period: cdk.Duration.minutes(1),
            }),
            running: new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'RunningTaskCount',
              dimensionsMap: {
                ServiceName: ecsServiceName,
                ClusterName: clusterName,
              },
              statistic: 'Minimum',
              period: cdk.Duration.minutes(1),
            }),
          },
          period: cdk.Duration.minutes(1),
        }),
        threshold: 0,
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        actionsEnabled: false,
      },
    );

    const deploymentActivityAlarm = new cloudwatch.Alarm(
      this,
      `${serviceName}-DeploymentActivityAlarm`,
      {
        alarmName: `${serviceName}-DeploymentActivity`,
        alarmDescription: `Detects active deployment for ${serviceName} based on pending task count`,
        metric: new cloudwatch.Metric({
          namespace: 'ECS/ContainerInsights',
          metricName: 'PendingTaskCount',
          dimensionsMap: {
            ServiceName: ecsServiceName,
            ClusterName: clusterName,
          },
          statistic: 'Maximum',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 0,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        actionsEnabled: false,
      },
    );

    const compositeAlarm = new cloudwatch.CompositeAlarm(
      this,
      `${serviceName}-TaskDegradationComposite`,
      {
        compositeAlarmName: `${serviceName}-TaskDegradation`,
        alarmDescription: `Service degradation detected for ${serviceName} - running tasks below desired and no active deployment.`,
        alarmRule: cloudwatch.AlarmRule.allOf(
          cloudwatch.AlarmRule.fromAlarm(
            taskCountMismatchAlarm,
            cloudwatch.AlarmState.ALARM,
          ),
          cloudwatch.AlarmRule.not(
            cloudwatch.AlarmRule.fromAlarm(
              deploymentActivityAlarm,
              cloudwatch.AlarmState.ALARM,
            ),
          ),
        ),
        actionsEnabled: true,
      },
    );

    compositeAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic),
    );
  }
}
