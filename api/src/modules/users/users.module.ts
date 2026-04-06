import { CommonModule } from '@module-common';
import { CqrsModule } from '@module-cqrs';
import { BobtailLoggingModule } from '@module-logger';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { DatabaseModule } from '@module-database';
import { UserController, EmployeesController } from './controllers';
import {
  CreateEmployeeCommandHandler,
  UpdateUserCommandHandler,
  UserService,
  EmailChangeValidator,
  UpdateUserValidationService,
} from './services';
import { EmployeeMapper } from './data/mappers/employees.mapper';

@Module({
  imports: [
    CommonModule,
    CqrsModule,
    AuthModule,
    BobtailLoggingModule,
    DatabaseModule,
    PersistenceModule,
  ],
  controllers: [UserController, EmployeesController],
  providers: [
    UserService,
    UpdateUserCommandHandler,
    EmployeeMapper,
    CreateEmployeeCommandHandler,
    UpdateUserValidationService,
    EmailChangeValidator,
  ],
  exports: [UserService],
})
export class UsersModule {}
