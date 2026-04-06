import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AuroraStack } from '../lib/persistent/aurora.stack';
import { VpcStack } from '../lib/infrastructure/vpc.stack';
import { envProps } from './test.props';
import { SecurityGroupStack } from '../lib/infrastructure/security-groups.stack';

describe('Aurora stack', () => {
  test('Aurora cluster', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'BobtailVPC', { envProps });
    const sgStack = new SecurityGroupStack(app, 'SG', {
      vpc: vpcStack.vpc,
      envProps,
    });

    const auroraStack = new AuroraStack(app, 'BobtailAurora', {
      vpc: vpcStack.vpc,
      auroraSecurityGroup: sgStack.auroraSecurityGroup,
      envProps,
    });

    const template = Template.fromStack(auroraStack);
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-postgresql',
      DatabaseName: `bobtailng`,
      DBClusterIdentifier: `${envProps.shortName}-bobtailng-v2`,
      DBClusterParameterGroupName: 'default.aurora-postgresql15',
      EngineVersion: '15.3',
      StorageEncrypted: true,
      BackupRetentionPeriod: 4,
    });
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupName: `${envProps.shortName}-aurora-subnetgroup`,
    });
  });
});
