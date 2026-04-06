import { Module } from '@nestjs/common';
import { CloudWatchService } from './cloudwatch/cloudwatch.service';
import { S3Service } from './s3/s3.service';
import { SECRETS_MANAGER, secretsManagerProvider } from './secret-manager';
import { SQSService } from './sqs/sqs.service';

@Module({
  providers: [SQSService, CloudWatchService, S3Service, secretsManagerProvider],
  exports: [SECRETS_MANAGER, SQSService, CloudWatchService, S3Service],
})
export class AWSModule {}
