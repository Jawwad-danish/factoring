import { EmployeeRepository } from '@module-persistence';
import { EmployeeEntity } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmployeeSeeder {
  private logger: Logger = new Logger(EmployeeSeeder.name);

  constructor(private readonly repository: EmployeeRepository) {}

  async create(data?: Partial<EmployeeEntity>): Promise<EmployeeEntity> {
    try {
      const employee = EntityStubs.buildEmployee(data);
      await this.repository.upsertAndFlush(employee);
      return employee;
    } catch (error) {
      this.logger.error(`Could not seed employee`, error);
      throw error;
    }
  }
}
