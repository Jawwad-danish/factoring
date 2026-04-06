import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends cdk.Stack {
  readonly ecrRepository: ecr.IRepository;
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.ecrRepository = ecr.Repository.fromRepositoryName(
      this,
      'bobtail-repository',
      'bobtail-ng',
    );
    if (!this.ecrRepository) {
      this.ecrRepository = new ecr.Repository(this, 'bobtail-repository', {
        repositoryName: 'bobtail-ng',
      });
    }
  }
}
