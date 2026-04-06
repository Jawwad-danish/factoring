import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { LambdaPaths } from '../../types';
import { UpdateDocsLambdaProps } from '../';
import { EnvProps } from '../../../cdk.config';

/**
 * Lambda for updating documents after processing.
 */
export const buildUpdateDocsUrlLambda = (
  scope: Construct,
  paths: LambdaPaths,
  //An example of using VPC for a lambda, will let here for future use
  //appConfigLambdaProps: AppConfigLambdaProps,
  //vpcProps: VpcLambdaProps,
  props: UpdateDocsLambdaProps,
  envProps: EnvProps,
): lambda.Function => {
  const lambdaPath = path.resolve(
    paths.lambdaRoot,
    'update-docs-url/handler.ts',
  );

  // !!! An example of using security groups for lambda. Will let commented here for future use
  // const lambdaSg = new ec2.SecurityGroup(scope, 'lambda-update-docs-url-sg', {
  //   description: 'SG for lambda',
  //   vpc: vpcProps.vpc,
  //   allowAllOutbound: true,
  // });
  // lambdaSg.connections.allowTo(
  //   vpcProps.dbSecurityGroup,
  //   ec2.Port.tcp(5432),
  //   'Allow db access from lambda update docs url',
  // );

  return new NodejsFunction(scope, `${envProps.shortName}-update-docs-url`, {
    entry: lambdaPath,
    projectRoot: paths.projectRoot,
    depsLockFilePath: paths.depsLockFile,
    handler: 'handler',
    functionName: `${envProps.shortName}-update-docs-url`,
    runtime: lambda.Runtime.NODEJS_18_X,
    timeout: Duration.seconds(30),
    bundling: {
      minify: true,
      sourceMap: true,
      externalModules: [
        'canvas',
        'cache-manager',
        '@nestjs/microservices',
        '@nestjs/microservices/microservices-module',
        '@nestjs/websockets/socket-module',
      ],
    },
    allowPublicSubnet: false,
    environment: {
      API_URL: props.apiUrl,
      NODE_ENV: envProps.name,
      NODE_OPTIONS: '--enable-source-maps',
    },
    // !!!An example of using vpc for lambda and security groups. Will elt here for future use
    // vpc: vpcProps.vpc,
    // vpcSubnets: vpcProps.vpc.selectSubnets({
    //   subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    // }),
    // securityGroups: [lambdaSg],
    // layers: [
    //   getAppConfigExtensionLayer(scope, 'update-docs-url-appconfig-ext'),
    // ],
  });
};
