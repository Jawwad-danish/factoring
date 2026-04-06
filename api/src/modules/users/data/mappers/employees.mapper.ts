import { Injectable } from '@nestjs/common';
import { DataMapper } from '@core/mapping';
import { Employee } from '../employee.model';
import { EmployeeEntity, UserEntity } from '@module-persistence/entities';
import { CreateEmployeeRequest } from '../web';

@Injectable()
export class EmployeeMapper implements DataMapper<EmployeeEntity, Employee> {
  createRequestToEntity(request: CreateEmployeeRequest): EmployeeEntity {
    const entity = new EmployeeEntity();
    entity.role = request.role;
    entity.extension = request.extension || null;

    const userEntity = new UserEntity();
    userEntity.email = request.email;
    userEntity.firstName = request.firstName;
    userEntity.lastName = request.lastName;

    entity.user = userEntity;
    return entity;
  }

  async entityToModel(entity: EmployeeEntity): Promise<Employee> {
    const model = new Employee();
    model.id = entity.id;
    model.role = entity.role;
    model.extension = entity.extension;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    if (entity.user) {
      model.firstName = entity.user.firstName;
      model.lastName = entity.user.lastName;
      model.email = entity.user.email;
    }
    return model;
  }
}
