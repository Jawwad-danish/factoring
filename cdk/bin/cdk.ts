#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk.stack';
import { getEnvProps } from '../lib/cdk.config';

const app = new cdk.App();
const env = app.node.tryGetContext('env') || 'development';
const envProps = getEnvProps(env);

new CdkStack(app, `${envProps.shortName}-MainStack`, {
  env: { account: envProps.accountId, region: envProps.region },
  description: `${envProps.shortName} Main Stack`,
  envProps: envProps,
});
