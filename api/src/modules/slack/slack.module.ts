import { Global, Module } from '@nestjs/common';
import { BobtailConfigModule } from '../bobtail-config/bobtail-config.modules';
import { AWSModule } from '../aws/aws.module';
import { SlackCredentialService } from './slack-credentials.service';
import { slackServiceProvider } from './slack.provider';

@Global()
@Module({
  imports: [BobtailConfigModule, AWSModule],
  providers: [SlackCredentialService, slackServiceProvider],
  exports: [slackServiceProvider],
})
export class SlackModule {}
