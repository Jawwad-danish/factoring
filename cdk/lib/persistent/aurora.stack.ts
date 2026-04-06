import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { EnvProps } from '../cdk.config';

export interface AuroraProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  auroraSecurityGroup: ec2.SecurityGroup;
  envProps: EnvProps;
}

export class AuroraStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly dbSecretARN: string;
  public readonly readerEndpointHost: string;

  constructor(scope: cdk.App, id: string, props: AuroraProps) {
    super(scope, id, props);
    const subnetGroup = new rds.SubnetGroup(
      this,
      `${props.envProps.shortName}-subnetGroup`,
      {
        description: `Subnetgroup for ${props.envProps.shortName} serverless postgres aurora database`,
        vpc: props.vpc,
        subnetGroupName: `${props.envProps.shortName}-aurora-subnetgroup`,
        vpcSubnets: {
          subnets: props.vpc.isolatedSubnets,
        },
      },
    );

    const readers = props.envProps.isProd
      ? [
          rds.ClusterInstance.serverlessV2('reader', {
            scaleWithWriter: true,
          }),
        ]
      : undefined;
    // Create Aurora RDS Serverless cluster
    this.cluster = new rds.DatabaseCluster(
      this,
      `${props.envProps.shortName}-Database`,
      {
        defaultDatabaseName: 'bobtailng',
        clusterIdentifier: `${props.envProps.shortName}-bobtailng-v2`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_3,
        }),
        serverlessV2MinCapacity: rds.AuroraCapacityUnit.ACU_1,
        serverlessV2MaxCapacity: rds.AuroraCapacityUnit.ACU_2,
        storageEncrypted: true,
        backup: {
          retention: props.envProps.isProd
            ? cdk.Duration.days(7)
            : cdk.Duration.days(4),
        },
        credentials: rds.Credentials.fromGeneratedSecret('clusteradmin', {
          secretName: `${props.envProps.shortName}-BobtailAuroraDatabaseSecret`,
        }),
        securityGroups: [props.auroraSecurityGroup],
        vpc: props.vpc,
        subnetGroup: subnetGroup,
        writer: rds.ClusterInstance.serverlessV2('writer'),
        readers: readers,
      },
    );
    this.dbSecretARN = this.cluster.secret?.secretArn || '';
    this.readerEndpointHost = this.cluster.clusterReadEndpoint.hostname;

    if (!this.dbSecretARN) {
      throw new Error('Could not extract DB secret ARN');
    }
  }
}
