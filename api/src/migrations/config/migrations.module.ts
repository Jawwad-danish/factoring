import {
  AWSModule,
  SECRETS_MANAGER,
  secretsManagerProvider,
} from '@module-aws';
import { CredentialsModule } from '@module-database';
import { Module } from '@nestjs/common';
import { BobtailConfigModule } from '../../modules/bobtail-config/bobtail-config.modules';
import { configServiceProvider } from '../../modules/bobtail-config/config-service.provider';
import { CONFIG_SERVICE } from '../../modules/bobtail-config/config.service';

@Module({
  imports: [BobtailConfigModule, AWSModule, CredentialsModule],
  providers: [secretsManagerProvider, configServiceProvider],
  exports: [CONFIG_SERVICE, SECRETS_MANAGER],
})
export class MigrationModule {}
