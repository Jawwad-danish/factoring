import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { PersistenceModule } from '@module-persistence';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AWSModule } from '../aws/aws.module';
import { AUTH0_SERVICE, Auth0ServiceProvider } from './auth0';
import { AuthorizationManager } from './authorization';
import { CognitoConfigService } from './credentials';
import { Auth0CredentialsService } from './credentials/auth0/auth0-credentials.service';
import { JwtAuthGuard, PermissionsGuard } from './guards';
import { AuthenticationManager, strategyProvider } from './strategy';
import { AuthTokenServiceProvider, UserTokenService } from './token';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HttpModule.register({}),
    AWSModule,
    BobtailConfigModule,
    PersistenceModule,
    CommonModule,
  ],
  providers: [
    Auth0CredentialsService,
    CognitoConfigService,
    strategyProvider,
    AuthTokenServiceProvider,
    UserTokenService,
    JwtAuthGuard,
    PermissionsGuard,
    AuthorizationManager,
    Auth0ServiceProvider,
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: PermissionsGuard,
    },
    AuthenticationManager,
  ],
  exports: [
    PassportModule,
    AuthTokenServiceProvider,
    UserTokenService,
    AUTH0_SERVICE,
  ],
})
export class AuthModule {}
