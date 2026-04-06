import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';
import { DatabaseService } from '@module-database';
import { EmployeeEntity } from '../entities/employee.entity';

@Injectable()
export class EmployeeRepository extends BasicRepository<EmployeeEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, EmployeeEntity);
  }

  findOneByUserId(userId: string): Promise<EmployeeEntity | null> {
    return this.repository.findOne({ user: { id: userId } });
  }
}
