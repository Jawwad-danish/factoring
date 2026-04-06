import { RemovalPolicy } from 'aws-cdk-lib';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import {
  IChainable,
  LogLevel,
  StateMachine,
  StateMachineType,
} from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { EnvProps } from '../../../cdk.config';

export const buildStepFunction = (
  scope: Construct,
  definition: IChainable,
  envProps: EnvProps,
) => {
  const name = `${envProps.shortName}-documents-processing`;
  const sfnLog = new LogGroup(scope, `${envProps.shortName}-sfnLog`, {
    logGroupName: `${name}-log-group`,
    removalPolicy: RemovalPolicy.DESTROY,
    retention: RetentionDays.ONE_WEEK,
  });
  return new StateMachine(scope, `${envProps.shortName}-step-function`, {
    definition: definition,
    stateMachineName: name,
    stateMachineType: StateMachineType.STANDARD,
    logs: {
      destination: sfnLog,
      includeExecutionData: true,
      level: LogLevel.ALL,
    },
  });
};
