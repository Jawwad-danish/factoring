import { Module } from '@nestjs/common';
import { BobtailConfigModule } from '@module-config';
import { AWSModule } from '@module-aws';
import { LaunchDarklyClientProvider } from './launch-darkly-client.provider';
import { LaunchDarklyConfigurationSupplier } from './launch-darkly-configuration.supplier';
import { LaunchDarklyService } from './launch-darkly.service';

@Module({
  imports: [BobtailConfigModule, AWSModule],
  providers: [
    LaunchDarklyClientProvider,
    LaunchDarklyConfigurationSupplier,
    LaunchDarklyService,
  ],
  exports: [LaunchDarklyService],
})
export class LaunchDarklyModule {}
