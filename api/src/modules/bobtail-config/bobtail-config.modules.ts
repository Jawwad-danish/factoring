import { environment } from '@core/environment';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configServiceProvider } from './config-service.provider';
import { CONFIG_SERVICE } from './config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `./envs/${environment.core.nodeEnv()}.env`,
    }),
  ],
  controllers: [],
  providers: [configServiceProvider],
  exports: [CONFIG_SERVICE],
})
export class BobtailConfigModule {}
