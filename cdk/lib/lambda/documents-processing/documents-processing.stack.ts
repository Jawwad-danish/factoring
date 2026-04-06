import * as cdk from 'aws-cdk-lib';

import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import {
  IChainable,
  Parallel,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';

import { LambdaPaths, getPaths } from '../';
import { DocumentsProcessingProps } from './';
import {
  buildCombinePdfLambda,
  buildCompressOrientLambda,
  buildDocumentsProcessingFailEventHandlerLambda,
  buildExecutorLambda,
  buildImageToPdfLambda,
  buildInvoiceCoverLambda,
  buildStepFunction,
  buildUpdateDocsUrlLambda,
  buildUploaderLambda,
} from './functions';

export class DocumentsProcessingStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: DocumentsProcessingProps) {
    super(scope, id, props);

    const paths = getPaths();
    const definition = this.buildDefinition(paths, props);
    const stateMachine = buildStepFunction(this, definition, props.envProps);
    //create an alarm when execution of state machine failed.
    new cloudwatch.Alarm(
      this,
      `${props.envProps.shortName}-StateMachineAlarm`,
      {
        metric: stateMachine.metricFailed(),
        threshold: 1,
        evaluationPeriods: 1,
        alarmName: `${props.envProps.shortName}-ProcessDocumentsAlarm`,
      },
    );
    buildExecutorLambda(
      this,
      paths,
      stateMachine,
      props.executorProps.queue,
      props.envProps,
    );
    this.addFailureEventsHandler(stateMachine, props, paths);
  }

  private buildDefinition(
    paths: LambdaPaths,
    props: DocumentsProcessingProps,
  ): IChainable {
    const uploadDocumentStep = new LambdaInvoke(this, 'upload-document-step', {
      lambdaFunction: buildUploaderLambda(
        this,
        paths,
        {
          name: props.uploaderProps.s3Bucket.bucketName,
          arn: props.uploaderProps.s3Bucket.bucketArn,
        },
        props.envProps,
      ),
      outputPath: '$.Payload',
    });
    const compressOrientStep = new LambdaInvoke(this, 'compress-orient-step', {
      lambdaFunction: buildCompressOrientLambda(
        this,
        paths,
        props.appConfigProps,
        props.secretsManagerProps.convertapiArn,
        props.envProps,
      ),
      outputPath: '$.Payload',
    });
    const createInvoiceCoverStep = new LambdaInvoke(
      this,
      'invoice-cover-step',
      {
        lambdaFunction: buildInvoiceCoverLambda(
          this,
          paths,
          props.appConfigProps,
          props.secretsManagerProps.convertapiArn,
          props.secretsManagerProps.dbArn,
          props.uploaderProps.s3Bucket,
          props.envProps,
          props.vpc,
          props.databaseSecurityGroup,
        ),
        outputPath: '$.Payload',
      },
    );
    const imageToPDFStep = new LambdaInvoke(this, 'image-to-pdf-step', {
      lambdaFunction: buildImageToPdfLambda(
        this,
        paths,
        props.appConfigProps,
        props.secretsManagerProps.filestackArn,
        props.envProps,
      ),
      outputPath: '$.Payload',
    });
    const combineStep = new LambdaInvoke(this, 'combine-pdf-step', {
      lambdaFunction: buildCombinePdfLambda(
        this,
        paths,
        props.appConfigProps,
        props.secretsManagerProps.convertapiArn,
        props.uploaderProps.s3Bucket,
        props.envProps,
      ),
      outputPath: '$.Payload',
    });
    const updateDocsStep = new LambdaInvoke(this, 'update-docs-step', {
      lambdaFunction: buildUpdateDocsUrlLambda(
        this,
        paths,
        props.updateDocsProps,
        props.envProps,
      ),
      outputPath: '$.Payload',
    });

    return new Parallel(this, 'lambda-parallel')
      .branch(createInvoiceCoverStep)
      .branch(imageToPDFStep.next(compressOrientStep).next(uploadDocumentStep))
      .next(combineStep)
      .next(updateDocsStep);
  }

  private addFailureEventsHandler(
    stateMachine: StateMachine,
    props: DocumentsProcessingProps,
    paths: LambdaPaths,
  ) {
    const ruleLambdaHandler = buildDocumentsProcessingFailEventHandlerLambda(
      this,
      paths,
      props.updateDocsProps,
      props.envProps,
    );
    new events.Rule(
      this,
      `${props.envProps.shortName}-document-processing-fail`,
      {
        eventPattern: {
          detail: {
            status: ['FAILED', 'TIMED_OUT', 'ABORTED'],
            stateMachineArn: [stateMachine.stateMachineArn],
          },
        },
        targets: [
          new targets.LambdaFunction(ruleLambdaHandler, {
            retryAttempts: 1,
          }),
        ],
      },
    );
  }
}
