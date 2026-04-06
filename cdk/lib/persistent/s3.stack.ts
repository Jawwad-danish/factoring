import * as cdk from 'aws-cdk-lib';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { EnvProps } from '../cdk.config';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface S3StackProps extends cdk.StackProps {
  envProps: EnvProps;
}

export class S3Stack extends cdk.Stack {
  readonly invoiceBucket: Bucket;
  readonly publicResourcesBucket: Bucket;
  readonly releaseLettersBucket: Bucket;
  readonly emailTemplatesBucket: Bucket;
  readonly reportTemplatesBucket: Bucket;
  readonly loggingBucket: Bucket;
  readonly integrationTestsStubsBucket: Bucket;
  readonly crossAccountBucket: Bucket;
  readonly reportsBucket: Bucket;
  readonly reportsSalesforceBucket: Bucket;

  constructor(scope: cdk.App, id: string, private props: S3StackProps) {
    super(scope, id, props);

    this.invoiceBucket = this.createBucket('bobtail-invoice-documents', true);

    // we need to populate invoice documents bucket with static assets required for invoice-cover
    new s3Deploy.BucketDeployment(this, 'DeployFiles', {
      sources: [
        s3Deploy.Source.asset(path.join(__dirname, 'invoice-cover-assets')),
      ],
      destinationBucket: this.invoiceBucket,
      destinationKeyPrefix: 'invoice-cover-template-files',
    });

    this.emailTemplatesBucket = this.createBucket(
      'bobtail-email-templates',
      false,
    );

    // we need to populate email templates bucket with static assets
    new s3Deploy.BucketDeployment(this, 'DeployTemplates', {
      sources: [s3Deploy.Source.asset(path.join(__dirname, 'email-templates'))],
      destinationBucket: this.emailTemplatesBucket,
    });

    this.reportTemplatesBucket = this.createBucket(
      'bobtail-report-templates',
      false,
    );

    // we need to populate report templates bucket with static assets
    new s3Deploy.BucketDeployment(this, 'DeployReportTemplates', {
      sources: [
        s3Deploy.Source.asset(path.join(__dirname, 'report-templates')),
      ],
      destinationBucket: this.reportTemplatesBucket,
    });

    this.loggingBucket = this.createBucket('bobtail-infra-logs');
    if (!props.envProps.isProd) {
      this.integrationTestsStubsBucket = this.createBucket(
        'bobtail-integration-testing-stubs',
        true,
      );
    }

    this.publicResourcesBucket = this.createBucket('public-resources', true);
    new s3Deploy.BucketDeployment(this, 'DeployPublicResources', {
      sources: [
        s3Deploy.Source.asset(path.join(__dirname, 'public-resources')),
      ],
      destinationBucket: this.publicResourcesBucket,
    });

    this.releaseLettersBucket = this.createBucket('release-letters', true);

    this.crossAccountBucket = this.createBucket('cross-account-bucket');
    this.crossAccountBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: `${this.props.envProps.shortName}-allow-cross-accounts-upload-to-bucket`,
        effect: iam.Effect.ALLOW,
        resources: [
          `${this.crossAccountBucket.bucketArn}/*`,
          this.crossAccountBucket.bucketArn,
        ],
        actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:ListBucket'],
        principals: [new iam.ArnPrincipal('arn:aws:iam::041050246697:root')],
      }),
    );
    this.crossAccountBucket.addLifecycleRule({
      expiration: cdk.Duration.days(20),
    });
    this.reportsBucket = this.createBucket('reports', true);
    this.reportsSalesforceBucket = this.createBucket(
      'reports-salesforce',
      true,
    );
  }

  private createBucket(name: string, publicBucket = false): Bucket {
    const bucketName = `${this.props.envProps.shortName}-${name}`;
    return new Bucket(this, bucketName, {
      publicReadAccess: publicBucket,
      bucketName: bucketName,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedOrigins: [
            'https://*.bobtail.com',
            'https://*.bobtailtest.com',
            'http://localhost:8080',
          ],
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
        },
      ],
      blockPublicAccess: {
        blockPublicAcls: publicBucket ? false : true,
        blockPublicPolicy: publicBucket ? false : true,
        ignorePublicAcls: publicBucket ? false : true,
        restrictPublicBuckets: publicBucket ? false : true,
      },
    });
  }
}
