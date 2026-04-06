import { Module } from '@nestjs/common';
import { AWSModule } from '../aws/aws.module';
import { BobtailConfigModule } from '../bobtail-config/bobtail-config.modules';
import { databaseServiceProvider } from './database.provider';
import { DatabaseService } from './database.service';
import { DatabaseCredentialService } from './database-credentials.service';

@Module({
  imports: [BobtailConfigModule, AWSModule],
  providers: [DatabaseCredentialService, databaseServiceProvider],
  exports: [DatabaseCredentialService, DatabaseService],
})
export class DatabaseModule {}

@Module({
  imports: [BobtailConfigModule, AWSModule],
  providers: [DatabaseCredentialService],
  exports: [DatabaseCredentialService],
})
export class CredentialsModule {}
