import {
  EmployeeEntity,
  EmployeeRole,
  RecordStatus,
  UserEntity,
} from '@module-persistence/entities';

export function buildEntity(userData: any): UserEntity {
  const entity = new UserEntity();
  entity.email = userData.email;
  entity.id = userData.id;
  let firstName;
  let lastName;
  if (userData.employee) {
    firstName = userData.employee.first_name;
    lastName = userData.employee.last_name;
  } else if (userData.client) {
    firstName = userData.client.shortened_name;
    lastName = null;
  } else {
    console.log(
      `Could not find name for user ${userData.id}. Null will be used`,
    );
    firstName = null;
    lastName = null;
  }
  entity.firstName = firstName;
  entity.lastName = lastName;
  entity.createdAt = userData.created_at;
  entity.updatedAt = userData.updated_at;
  return entity;
}

export function buildEmployeeEntity(employeeData: any): EmployeeEntity {
  const entity = new EmployeeEntity();
  entity.id = employeeData.id;
  entity.extension = employeeData.extension;
  entity.role = mapEmployeeRole(employeeData.role);
  entity.createdAt = employeeData.created_at;
  entity.updatedAt = employeeData.updated_at;
  entity.recordStatus =
    employeeData.status === 'active'
      ? RecordStatus.Active
      : RecordStatus.Inactive;
  return entity;
}

const mapEmployeeRole = (role: string): EmployeeRole | null => {
  switch (role) {
    case 'Account Manager':
      return EmployeeRole.AccountManager;
    case 'Underwriter':
      return EmployeeRole.Underwriter;
    case 'Collections Specialist':
      return EmployeeRole.CollectionsSpecialist;
    case 'Processor':
      return EmployeeRole.Processor;
    case 'Master':
      return EmployeeRole.Master;
    case 'Salesperson':
      return EmployeeRole.Salesperson;
    default:
      return null;
  }
};
